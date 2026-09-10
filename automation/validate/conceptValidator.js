import Ajv from "ajv";
import { LUMINA_SCHEMA } from "./luminaSchema.js";

const ajv = new Ajv({
    allErrors: true,
    strict: false
});

const validateSchema =
    ajv.compile(LUMINA_SCHEMA);


export function validateConcept(concept) {
    const valid =
        validateSchema(concept);

    if (valid) {
        return {
            valid: true,
            errors: []
        };
    }

    return {
        valid: false,
        errors: validateSchema.errors || []
    };
}


export function assertValidConcept(concept) {
    const result =
        validateConcept(concept);

    if (!result.valid) {
        const errorText =
            result.errors
                .map(error => {
                    const path =
                        error.instancePath || "(root)";

                    return `${path} ${error.message}`;
                })
                .join("\n");

        throw new Error(
            `Lumina concept validation failed:\n${errorText}`
        );
    }

    return true;
}