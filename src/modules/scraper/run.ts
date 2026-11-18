import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeAnime } from "./spacePowerScraper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.argv[2];

if (!url) {
  throw new Error(
    "Usage: npm run scrape -- <anime-detail-page-url>"
  );
}

try {
  console.log("Scraping anime...");

  const anime = await scrapeAnime(url);

  // Generate a safe filename from the anime title
  const filename =
    anime.title
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "anime";

  // Save the JSON file beside run.ts
  const outputPath = path.join(__dirname, `${filename}.json`);

  await writeFile(
    outputPath,
    JSON.stringify(anime, null, 2),
    "utf-8"
  );

  console.log(`\nScraping completed successfully.`);
  console.log(`JSON saved to: ${outputPath}`);

  // Display the result in the terminal
  console.dir(anime, { depth: null });
} catch (error) {
  console.error("Scraping failed:", error);
  process.exitCode = 1;
}