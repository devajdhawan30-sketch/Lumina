import fs from "fs/promises";

import { fetchOpenStax } from "../fetch/openstaxFetcher.js";
import { extractOpenStaxContent } from "../fetch/openstaxExtractor.js";
import { generateConcept } from "./conceptGenerator.js";
import { validateConcept } from "../validate/conceptValidator.js";

const OPENSTAX_URL =
    "https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-2-right-triangle-trigonometry";

const CONCEPT_ID =
    "right-triangle-trigonometry";

const TITLE =
    "Right Triangle Trigonometry";

const OUTPUT_PATH =
    "automation/output/right-triangle-trigonometry.json";

const CONTENT_PATH =
    "content/concepts/trigonometric-ratios/10_right-triangle-trigonometry.json";

async function main() {
    console.log("========================================");
    console.log("LUMINA CONTENT GENERATOR");
    console.log("========================================");

    console.log("\nFetching OpenStax...");

    const html =
        await fetchOpenStax(
            OPENSTAX_URL
        );

    console.log(
        `Fetched HTML: ${html.length}`
    );

    console.log(
        "\nExtracting OpenStax content..."
    );

    const source =
        extractOpenStaxContent(
            html,
            OPENSTAX_URL
        );

    console.log(
        `Extracted blocks: ${source.content.length}`
    );

    console.log(
        "\nGenerating Lumina concept..."
    );

    const concept =
        await generateConcept({
            source,
            conceptId: CONCEPT_ID,
            title: TITLE,
            subject: "mathematics",
            topic: "trigonometry",
            section: "right-triangle-trigonometry",
            difficulty: 2,
            sourceId: "openstax"
        });

    console.log(
        "\nValidating generated concept..."
    );

    const validation =
        validateConcept(concept);

    if (!validation.valid) {
        console.error(
            "\n========================================"
        );

        console.error(
            "VALIDATION FAILED"
        );

        console.error(
            "========================================"
        );

        for (const error of validation.errors) {
            console.error(
                `${error.instancePath || "(root)"}: ${
                    error.message
                }`
            );
        }

        process.exit(1);
    }

    console.log(
        "Validation successful."
    );

    console.log(
        "\nSaving automation output..."
    );

    await fs.writeFile(
        OUTPUT_PATH,
        JSON.stringify(
            concept,
            null,
            2
        ),
        "utf-8"
    );

    console.log(
        `Saved to: ${OUTPUT_PATH}`
    );

    console.log(
        "\nPublishing concept to Lumina content..."
    );

    await fs.writeFile(
        CONTENT_PATH,
        JSON.stringify(
            concept,
            null,
            2
        ),
        "utf-8"
    );

    console.log(
        `Published to: ${CONTENT_PATH}`
    );

    console.log(
        "\n========================================"
    );

    console.log(
        "GENERATION SUCCESS"
    );

    console.log(
        "========================================"
    );

    console.log(
        `Concept ID: ${concept.id}`
    );

    console.log(
        `Concept title: ${concept.title}`
    );
}

main().catch(error => {

    console.error(
        "\n========================================"
    );

    console.error(
        "GENERATION FAILED"
    );

    console.error(
        "========================================"
    );

    console.error(
        error.stack || error.message
    );

    process.exit(1);
});