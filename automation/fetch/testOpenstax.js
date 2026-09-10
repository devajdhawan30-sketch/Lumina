import { fetchOpenStax } from "./openstaxFetcher.js";
import { extractOpenStaxContent } from "./openstaxExtractor.js";

const url =
    "https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-2-right-triangle-trigonometry";

try {
    const html = await fetchOpenStax(url);

    console.log("Successfully fetched OpenStax page.");
    console.log("HTML length:", html.length);

    const extracted = extractOpenStaxContent(html);

    console.log("\n========================================");
    console.log("EXTRACTED CONTENT");
    console.log("========================================");

    console.log("\nTitle:");
    console.log(extracted.title);

    console.log("\nNumber of content blocks:");
    console.log(extracted.content.length);

    console.log("\nContent:");

    extracted.content.forEach((block, index) => {
        console.log(`\n--- Block ${index + 1} ---`);
        console.log(JSON.stringify(block, null, 2));
    });

    console.log("\n========================================");
    console.log("CONTENT TYPE SUMMARY");
    console.log("========================================");

    const counts = {};

    for (const block of extracted.content) {
        counts[block.type] = (counts[block.type] || 0) + 1;
    }

    console.log(counts);

} catch (error) {
    console.error("\nERROR:");
    console.error(error.message);
    console.error(error);
}