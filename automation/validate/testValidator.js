import fs from "fs/promises";
import {
    validateConcept
} from "./conceptValidator.js";

const filePath =
    "automation/output/trigonometric-ratios.json";

try {
    console.log(
        "Loading generated concept..."
    );

    const raw =
        await fs.readFile(
            filePath,
            "utf-8"
        );

    const concept =
        JSON.parse(raw);

    console.log(
        `Concept: ${concept.title}`
    );

    console.log(
        "Validating Lumina schema..."
    );

    const result =
        validateConcept(concept);

    if (!result.valid) {
        console.log(
            "\n========================================"
        );

        console.log(
            "VALIDATION FAILED"
        );

        console.log(
            "========================================"
        );

        for (const error of result.errors) {
            console.log(
                `${error.instancePath || "(root)"}: ${
                    error.message
                }`
            );
        }

        process.exit(1);
    }

    console.log(
        "\n========================================"
    );

    console.log(
        "VALIDATION SUCCESS"
    );

    console.log(
        "========================================"
    );

    console.log(
        "The generated concept follows the Lumina schema."
    );

} catch (error) {
    console.error(
        "\n========================================"
    );

    console.error(
        "VALIDATION ERROR"
    );

    console.error(
        "========================================"
    );

    console.error(
        error.message
    );

    process.exit(1);
}
