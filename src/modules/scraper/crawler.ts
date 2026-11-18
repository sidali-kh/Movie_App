
import axios from "axios";
import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scrapeAnime } from "./spacePowerScraper.js";

const BASE_URL = "https://spacepowerfan.com";

const DEFAULT_START_URL = `${BASE_URL}/search/`;
const MAX_PAGES = 20;
const MAX_ITEMS = 100;
const REQUEST_DELAY_MS = 1000;

const client = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "MovieAppCrawler/1.0 (personal research)",
    Accept: "text/html,application/xhtml+xml",
  },
});

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);

    if (url.hostname !== new URL(BASE_URL).hostname) {
      return null;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    url.hash = "";
    url.searchParams.sort();

    return url.href;
  } catch {
    return null;
  }
}

function isAnimeDetailUrl(urlString: string): boolean {
  const url = new URL(urlString);
  const segments = url.pathname.split("/").filter(Boolean);

  // Matches /anime/title-slug/, not /anime/
  return (
    segments.length === 2 &&
    segments[0] === "anime"
  );
}

function isListingUrl(urlString: string): boolean {
  const url = new URL(urlString);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return false;

  // Main catalog and search pages
  if (
    segments.length === 1 &&
    ["anime", "search"].includes(segments[0])
  ) {
    return true;
  }

  // Category pages
  if (
    segments.length === 2 &&
    ["genre", "status", "anime-type"].includes(segments[0])
  ) {
    return true;
  }

  // Allow paginated catalog URLs, but not detail pages.
  return false;
}

async function getPageLinks(
  pageUrl: string,
): Promise<{ details: string[]; listings: string[] }> {
  const response = await client.get<string>(pageUrl);
  const $ = cheerio.load(response.data);

  const details = new Set<string>();
  const listings = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const url = normalizeUrl(href, pageUrl);
    if (!url) return;

    if (isAnimeDetailUrl(url)) {
      details.add(url);
    } else if (isListingUrl(url)) {
      listings.add(url);
    }
  });

  // Also follow standard pagination links when present.
  $('a[rel="next"], .pagination a, nav a').each(
    (_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      const url = normalizeUrl(href, pageUrl);
      if (!url) return;

      const parsed = new URL(url);
      const current = new URL(pageUrl);

      if (
        parsed.pathname === current.pathname &&
        parsed.search !== current.search
      ) {
        listings.add(url);
      }
    },
  );

  return {
    details: [...details],
    listings: [...listings],
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) =>
    setTimeout(resolveSleep, ms),
  );
}

async function crawl(): Promise<void> {
  const startUrl = process.argv[2] ?? DEFAULT_START_URL;
  const maxItems = Number(process.argv[3] ?? MAX_ITEMS);
  const maxPages = Number(process.argv[4] ?? MAX_PAGES);

  if (
    !Number.isInteger(maxItems) ||
    maxItems < 1 ||
    !Number.isInteger(maxPages) ||
    maxPages < 1
  ) {
    throw new Error(
      "maxItems and maxPages must be positive integers.",
    );
  }

  const normalizedStart = normalizeUrl(startUrl, BASE_URL);

  if (!normalizedStart || !isListingUrl(normalizedStart)) {
    throw new Error(
      "Start URL must be a supported SpacePowerFan listing URL.",
    );
  }

  const pendingPages = [normalizedStart];
  const visitedPages = new Set<string>();
  const detailUrls = new Set<string>();

  while (
    pendingPages.length > 0 &&
    visitedPages.size < maxPages &&
    detailUrls.size < maxItems
  ) {
    const pageUrl = pendingPages.shift()!;

    if (visitedPages.has(pageUrl)) continue;
    visitedPages.add(pageUrl);

    console.log(
      `\n[Crawl ${visitedPages.size}/${maxPages}] ${pageUrl}`,
    );

    try {
      const { details, listings } =
        await getPageLinks(pageUrl);

      for (const detailUrl of details) {
        detailUrls.add(detailUrl);

        if (detailUrls.size >= maxItems) break;
      }

      for (const listingUrl of listings) {
        if (
          !visitedPages.has(listingUrl) &&
          !pendingPages.includes(listingUrl)
        ) {
          pendingPages.push(listingUrl);
        }
      }

      console.log(`Discovered: ${detailUrls.size} detail URLs`);
    } catch (error) {
      console.error(
        `Failed to crawl ${pageUrl}:`,
        error instanceof Error ? error.message : error,
      );
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\nDiscovered ${detailUrls.size} unique URLs.`);
  const results: unknown[] = [];
  const failed: { url: string; error: string }[] = [];

  // Sequential processing avoids sending many simultaneous requests.
  for (const [index, url] of [...detailUrls].entries()) {
    console.log(
      `\n[Scrape ${index + 1}/${detailUrls.size}] ${url}`,
    );

    try {
      const result = await scrapeAnime(url);
      results.push(result);
      console.log("Scraped successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      failed.push({ url, error: message });
      console.error(`Scraping failed: ${message}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  const output = {
    source: BASE_URL,
    startUrl: normalizedStart,
    crawledListingPages: [...visitedPages],
    discoveredCount: detailUrls.size,
    successfulCount: results.length,
    failedCount: failed.length,
    results,
    failed,
    completedAt: new Date().toISOString(),
  };

  const outputPath = resolve(
    process.cwd(),
    "spacepowerfan-results.json",
  );

  await writeFile(
    outputPath,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log(`\nResults saved to: ${outputPath}`);
  console.log(
    `Successful: ${results.length} | Failed: ${failed.length}`,
  );
}

crawl().catch((error: unknown) => {
  console.error("Crawler stopped:", error);
  process.exitCode = 1;
});
