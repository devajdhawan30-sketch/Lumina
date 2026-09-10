import { fetchOpenStax } from "../fetch/openstaxFetcher.js";
import { extractOpenStaxContent } from "../fetch/openstaxExtractor.js";
import { generateConcept } from "./conceptGenerator.js";
import fs from "fs/promises";

const url =
    "https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-2-right-triangle-trigonometry";

try {
    console.log("Fetching OpenStax...");

    const html = await fetchOpenStax(url);

    console.log("Fetched HTML:", html.length);

    console.log("Extracting content...");

    const source = extractOpenStaxContent(html);

    console.log("Extracted blocks:", source.content.length);

    console.log("Generating Lumina concept...");

    const concept = await generateConcept({
        source,
        conceptId: "trigonometric-ratios",
        title: "Trigonometric Ratios in Right Triangles",
        subject: "mathematics",
        topic: "trigonometry",
        section: "right-triangle-trigonometry",
        difficulty: 2,
        sourceId: "openstax"
    });

    await fs.mkdir("automation/output", {
        recursive: true
    });

    const outputPath =
        "automation/output/trigonometric-ratios.json";

    await fs.writeFile(
        outputPath,
        JSON.stringify(concept, null, 2),
        "utf-8"
    );

    console.log("\n========================================");
    console.log("SUCCESS");
    console.log("========================================");

    console.log("Concept:", concept.title);
    console.log("Output:", outputPath);

} catch (error) {
    console.error("\n========================================");
    console.error("GENERATION FAILED");
    console.error("========================================");

    console.error(error.message);
}