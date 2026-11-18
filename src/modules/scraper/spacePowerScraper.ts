import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://spacepowerfan.com";

const http = axios.create({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  },
});

export interface VideoServer {
  name: string;
  embedUrl: string;
  directUrl: string | null;
}

export interface AnimeMetadata {
  sourceUrl: string;
  title: string;
  poster: string | null;
  description: string;
  firstAired: string | null;
  season: string | null;
  ageRating: string | null;
  originalTitle: string | null;
  englishTitle: string | null;
  aired: string | null;
  duration: string | null;
  episodes: number | null;
  rating: number | null;
  genres: string[];
  studio: string | null;
  producers: string[];
  status: string | null;
  watchPages: string[];
  videoServers: VideoServer[];
  megaLinks: string[];
}

function cleanText(value?: string | null): string | null {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;

  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function normalizeUrl(value: string, baseUrl: string): string {
  return new URL(value, baseUrl).href;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function normalizeServerName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

/**
 * Normalizes MEGA embed URLs to share URLs.
 * Other providers retain their original embed URL.
 */
function getDirectUrl(embedUrl: string): string | null {
  try {
    const parsed = new URL(embedUrl);

    if (
      !["mega.nz", "www.mega.nz"].includes(parsed.hostname)
    ) {
      return null;
    }

    if (parsed.pathname.startsWith("/embed/")) {
      parsed.pathname = parsed.pathname.replace(
        /^\/embed\//,
        "/file/"
      );
    }

    if (!parsed.pathname.startsWith("/file/")) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Extracts video-server links from a watch page.
 *
 * Supports:
 * - Base64-encoded data-embed-id attributes
 * - Normal iframe and link attributes
 * - URLs embedded in the share dialog
 *
 * The server name is not hardcoded, so newly added providers
 * can be collected whenever their URLs appear in the HTML.
 */
function extractVideoServers(
  $: cheerio.CheerioAPI
): VideoServer[] {
  const servers = new Map<string, VideoServer>();

  function addServer(name: string, rawUrl: string): void {
    const cleanedUrl = decodeHtml(rawUrl)
      .replace(/\\\//g, "/")
      .replace(/[),.;"'<>]+$/, "")
      .trim();

    try {
      const parsed = new URL(cleanedUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return;
      }

      const embedUrl = parsed.href;
      const normalizedName = normalizeServerName(name) || "Unknown";

      const key = `${normalizedName.toLowerCase()}|${embedUrl}`;

      servers.set(key, {
        name: normalizedName,
        embedUrl,
        directUrl: getDirectUrl(embedUrl),
      });
    } catch {
      // Ignore malformed URLs.
    }
  }

  function extractUrlsFromText(value: string): void {
    const decoded = decodeHtml(value).replace(/\\\//g, "/");

    // Capture HTTP(S) URLs from HTML text and attributes.
    const matches = decoded.match(
      /https?:\/\/[^\s"'<>\\]+/gi
    );

    for (const match of matches ?? []) {
      const cleaned = match.replace(/[),.;"'<>]+$/, "");

      try {
        const parsed = new URL(cleaned);

        // Avoid treating the source website and unrelated assets
        // as video providers.
        if (
          parsed.hostname === "mega.nz" ||
          parsed.hostname === "www.mega.nz"
        ) {
          if (
            parsed.pathname.startsWith("/embed/") ||
            parsed.pathname.startsWith("/file/")
          ) {
            addServer("MEGA", parsed.href);
          }
        }
      } catch {
        // Ignore malformed URLs.
      }
    }
  }

  // 1. Decode the server switcher values.
  $("[data-embed-id]").each((_, element) => {
    const encodedValue = $(element).attr("data-embed-id");
    if (!encodedValue) return;

    const separatorIndex = encodedValue.indexOf(":");
    if (separatorIndex === -1) return;

    const encodedName = encodedValue.slice(0, separatorIndex);
    const encodedUrl = encodedValue.slice(separatorIndex + 1);

    const decodedName = decodeBase64(encodedName);
    const decodedUrl = decodeBase64(encodedUrl);

    if (!decodedName || !decodedUrl) return;

    addServer(decodedName, decodedUrl);

    console.log(`[SERVER] ${decodedName}: ${decodedUrl}`);
  });

  // 2. Inspect iframes, links and other common embed attributes.
  const attributes = [
    "src",
    "data-src",
    "href",
    "data-href",
    "data-url",
    "data-video",
  ];

  $(
    "iframe, video, source, a[href], " +
      "[src], [data-src], [data-href], [data-url], [data-video]"
  ).each((_, element) => {
    const item = $(element);

    for (const attribute of attributes) {
      const value = item.attr(attribute);
      if (!value) continue;

      const decoded = decodeHtml(value).trim();

      try {
        const parsed = new URL(decoded, BASE_URL);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          continue;
        }

        const hostname = parsed.hostname.toLowerCase();

        // Keep MEGA links found outside the server switcher.
        if (
          (hostname === "mega.nz" ||
            hostname === "www.mega.nz") &&
          (parsed.pathname.startsWith("/embed/") ||
            parsed.pathname.startsWith("/file/"))
        ) {
          addServer("MEGA", parsed.href);
          continue;
        }

        // Collect known iframe providers when the URL is directly
        // exposed in an iframe or an explicit embed-related element.
        const isEmbedElement =
          item.is("iframe") ||
          item.is("[data-src]") ||
          item.is("[data-href]") ||
          item.is("[data-url]") ||
          item.is("[data-video]");

        if (isEmbedElement) {
          const hostParts = hostname.split(".");
          const provider =
            hostParts.length >= 2
              ? hostParts.slice(-2).join(".")
              : hostname;

          addServer(provider, parsed.href);
        }
      } catch {
        // Ignore malformed URLs and non-URL attribute values.
      }
    }

    // Some themes place embed URLs inside HTML snippets.
    extractUrlsFromText(item.html() ?? "");
  });

  // 3. Read share-dialog text and embedded iframe code.
  $(
    "#share-link-field, #embed-code-field, " +
      "[id*='share-link'], [id*='embed-code']"
  ).each((_, element) => {
    extractUrlsFromText($(element).text());
    extractUrlsFromText($.html(element) ?? "");
  });

  return [...servers.values()];
}

async function scrapeWatchPage(
  url: string
): Promise<VideoServer[]> {
  try {
    const response = await http.get(url);
    const $ = cheerio.load(response.data);

    const servers = extractVideoServers($);

    console.log(
      `[WATCH] ${url} -> ${servers.length} video server(s)`
    );

    return servers;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `[WATCH ERROR] ${url}: HTTP ${
          error.response?.status ?? "network error"
        }`
      );
    } else {
      console.error(`[WATCH ERROR] ${url}:`, error);
    }

    return [];
  }
}

export async function scrapeAnime(
  url: string
): Promise<AnimeMetadata> {
  const response = await http.get(url);
  const $ = cheerio.load(response.data);

  const details: Record<string, string> = {};

  // Extract metadata from the anime information list.
  $("ul.text-\\[13px\\] > li").each((_, element) => {
    const item = $(element);

    const label = item
      .find("span.font-semibold")
      .first()
      .text()
      .trim()
      .replace(/:$/, "");

    if (!label) return;

    const clone = item.clone();

    clone.find("span.font-semibold, a").remove();

    details[label] = clone.text().replace(/\s+/g, " ").trim();
  });

  const get = (label: string) => cleanText(details[label]);

  // Poster, including lazy-loaded images.
  const posterElement = $("img.wp-post-image").first();

  const posterValue =
    posterElement.attr("data-src") ||
    posterElement.attr("data-lazy-src") ||
    posterElement.attr("src");

  const poster = posterValue
    ? normalizeUrl(posterValue, url)
    : null;

  // Description.
  const descriptionSelectors = [
    ".entry-content",
    ".anime-description",
    ".description",
    ".summary",
  ];

  let description = "";

  for (const selector of descriptionSelectors) {
    const candidate = $(selector)
      .find("p")
      .map((_, element) => $(element).text().trim())
      .get()
      .find(
        (text) =>
          text.length > 30 &&
          !text.includes("التسجيل معطل حالياً") &&
          !text.includes("تسجيل الدخول هنا")
      );

    if (candidate) {
      description = candidate;
      break;
    }
  }

  if (!description) {
    description =
      $("p")
        .map((_, element) => $(element).text().trim())
        .get()
        .find(
          (text) =>
            text.length > 30 &&
            !text.includes("التسجيل معطل حالياً") &&
            !text.includes("تسجيل الدخول هنا")
        ) ?? "";
  }

  // Genres and producers.
  const genres: string[] = [];
  const producers: string[] = [];

  $("ul.text-\\[13px\\] > li").each((_, element) => {
    const item = $(element);

    const label = item
      .find("span.font-semibold")
      .first()
      .text()
      .trim()
      .replace(/:$/, "");

    const values = item
      .find("a")
      .map((_, anchor) => $(anchor).text().trim())
      .get()
      .filter(Boolean);

    if (label === "النوع") genres.push(...values);
    if (label === "المنتج") producers.push(...values);
  });

  // Discover individual episode pages, excluding /watch/ itself.
  const watchPages = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      const parsedUrl = new URL(href, url);

      if (
        parsedUrl.hostname === new URL(BASE_URL).hostname &&
        /^\/watch\/[^/]+\/?$/.test(parsedUrl.pathname)
      ) {
        parsedUrl.hash = "";
        parsedUrl.search = "";
        watchPages.add(parsedUrl.href);
      }
    } catch {
      // Ignore malformed URLs.
    }
  });

  // Extract providers from the anime page itself.
  const videoServers = new Map<string, VideoServer>();

  for (const server of extractVideoServers($)) {
    videoServers.set(
      `${server.name.toLowerCase()}|${server.embedUrl}`,
      server
    );
  }

  console.log(`[ANIME] ${url}`);
  console.log(`[ANIME] Found ${watchPages.size} watch page(s)`);

  // Visit each episode page sequentially.
  for (const watchUrl of watchPages) {
    const servers = await scrapeWatchPage(watchUrl);

    for (const server of servers) {
      videoServers.set(
        `${server.name.toLowerCase()}|${server.embedUrl}`,
        server
      );
    }
  }

  const allServers = [...videoServers.values()];

  const megaLinks = [
    ...new Set(
      allServers
        .map((server) => server.directUrl)
        .filter((link): link is string => link !== null)
    ),
  ];

  console.log(`[ANIME] Found ${allServers.length} video server link(s)`);
  console.log(`[ANIME] Found ${megaLinks.length} MEGA link(s)`);

  return {
    sourceUrl: url,
    title: $("h1").first().text().replace(/\s+/g, " ").trim(),
    poster,
    description,
    firstAired: get("تم عرضه لأول مرة"),
    season: get("موسم"),
    ageRating: get("معدل"),
    originalTitle: get("أصلي"),
    englishTitle: get("English"),
    aired: get("تم عرضه"),
    duration: get("المدة الزمنية"),
    episodes: parseNumber(get("الحلقات")),
    rating: parseNumber(get("التقييم")),
    genres: [...new Set(genres)],
    studio: get("الاستديو"),
    producers: [...new Set(producers)],
    status: get("الحالة"),
    watchPages: [...watchPages],
    videoServers: allServers,
    megaLinks,
  };
}

export async function scrapeAnimeListing(
  listingUrl: string
): Promise<string[]> {
  const response = await http.get(listingUrl);
  const $ = cheerio.load(response.data);

  const urls = new Set<string>();
  const baseHostname = new URL(BASE_URL).hostname;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      const parsedUrl = new URL(href, listingUrl);

      if (
        parsedUrl.hostname === baseHostname &&
        parsedUrl.pathname !== "/" &&
        !parsedUrl.pathname.startsWith("/genre/") &&
        !parsedUrl.pathname.startsWith("/studio/") &&
        !parsedUrl.pathname.startsWith("/producer/") &&
        !parsedUrl.pathname.startsWith("/status/") &&
        !parsedUrl.pathname.startsWith("/watch/")
      ) {
        parsedUrl.hash = "";
        urls.add(parsedUrl.href);
      }
    } catch {
      // Ignore malformed URLs.
    }
  });

  return [...urls];
}