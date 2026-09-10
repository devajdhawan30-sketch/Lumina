import { GoogleGenAI } from "@google/genai";
import { LUMINA_SCHEMA } from "../validate/luminaSchema.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash"
];

const MIN_LINES = 600;
const MAX_LINES = 800;
const MAX_EXPANSION_ROUNDS = 2;


function parseGeminiJson(text) {
    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(
            /^```(?:json)?\s*/i,
            ""
        );

        cleaned = cleaned.replace(
            /\s*```$/,
            ""
        );
    }

    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch (firstError) {
        let recovered = "";
        let insideString = false;
        let escaped = false;

        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];

            if (escaped) {
                recovered += char;
                escaped = false;
                continue;
            }

            if (char === "\\") {
                if (insideString) {
                    const next = cleaned[i + 1];

                    if (
                        next === '"' ||
                        next === "\\" ||
                        next === "/" ||
                        next === "b" ||
                        next === "f" ||
                        next === "n" ||
                        next === "r" ||
                        next === "t" ||
                        next === "u"
                    ) {
                        recovered += char;
                        escaped = true;
                    } else {
                        recovered += "\\\\";
                    }
                } else {
                    recovered += char;
                }

                continue;
            }

            if (char === '"') {
                insideString = !insideString;
            }

            recovered += char;
        }

        try {
            return JSON.parse(recovered);
        } catch (secondError) {
            throw new Error(
                `Gemini returned invalid JSON: ${secondError.message}`
            );
        }
    }
}


function blockToText(block) {
    switch (block.type) {
        case "heading":
            return `HEADING: ${block.text}`;

        case "paragraph":
            return `PARAGRAPH: ${block.text}`;

        case "list":
            return [
                "LIST:",
                ...block.items.map(
                    item => `- ${item}`
                )
            ].join("\n");

        case "equation":
            return [
                "EQUATION:",
                `Rendered text: ${block.text || ""}`,
                `LaTeX: ${block.latex || ""}`
            ].join("\n");

        case "figure":
            return [
                "FIGURE:",
                `Alt text: ${block.image?.alt || ""}`,
                `Caption: ${block.caption || ""}`
            ].join("\n");

        case "note":
            return [
                "NOTE:",
                block.title
                    ? `Title: ${block.title}`
                    : "",
                `Text: ${block.text || ""}`
            ]
                .filter(Boolean)
                .join("\n");

        case "example":
            return [
                "SOURCE EXAMPLE:",
                block.title
                    ? `Title: ${block.title}`
                    : "",
                `Content: ${block.text || ""}`
            ]
                .filter(Boolean)
                .join("\n");

        default:
            return "";
    }
}


function sourceToText(source) {
    return source.content
        .map(blockToText)
        .filter(Boolean)
        .join("\n\n");
}


function splitIntoSections(source) {
    const sections = [];

    let current = {
        title: "Introduction",
        blocks: []
    };

    for (const block of source.content) {
        if (
            block.type === "heading" &&
            current.blocks.length > 0
        ) {
            sections.push(current);

            current = {
                title: block.text,
                blocks: []
            };
        } else if (block.type === "heading") {
            current.title = block.text;
        } else {
            current.blocks.push(block);
        }
    }

    if (current.blocks.length > 0) {
        sections.push(current);
    }

    return sections;
}


function sectionToText(section) {
    return section.blocks
        .map(blockToText)
        .filter(Boolean)
        .join("\n\n");
}


async function callGemini({
    prompt,
    schema = null
}) {
    let lastError = null;

    for (const model of MODELS) {
        try {
            console.log(`    → ${model}`);

            const config = {};

            if (schema) {
                config.responseMimeType =
                    "application/json";

                config.responseSchema =
                    schema;
            }

            const response =
                await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config
                });

            if (!response.text) {
                throw new Error(
                    `${model} returned an empty response`
                );
            }

            return parseGeminiJson(
                response.text
            );

        } catch (error) {
            lastError = error;

            const message =
                error.message || "";

            const temporary =
                message.includes("503") ||
                message.includes("UNAVAILABLE") ||
                message.includes("high demand") ||
                message.includes("overloaded");

            if (!temporary) {
                throw error;
            }

            console.log(
                "    Model unavailable, trying next model..."
            );
        }
    }

    throw new Error(
        `All Gemini models failed: ${
            lastError?.message || "Unknown error"
        }`
    );
}


/*
=========================================================
STAGE 1
BUILD OUTLINE
=========================================================
*/

async function generateOutline({
    sourceText,
    title
}) {
    console.log(
        "\n[1/6] Building concept outline..."
    );

    const prompt = `
You are designing the educational structure for Lumina.

Concept:
${title}

Read the complete source material.

Create a detailed teaching outline.

Identify EVERY major educational idea.

Do not summarize away important material.

For a substantial source, prefer 8–15 logical sections.

Each section should represent a meaningful teaching unit.

Cover:

- definitions
- concepts
- relationships
- procedures
- formulas
- special cases
- applications
- important reasoning
- examples

Return ONLY JSON:

{
    "sections": [
        {
            "id": "section-id",
            "title": "Section title",
            "topics": [
                "topic 1",
                "topic 2"
            ]
        }
    ]
}

SOURCE:

${sourceText}
`;

    return await callGemini({
        prompt
    });
}


/*
=========================================================
STAGE 2
DETAILED THEORY
=========================================================
*/

async function generateTheory({
    sourceSections,
    outline
}) {
    console.log(
        "\n[2/6] Generating detailed theory..."
    );

    const generatedSections = [];

    const relevantSource =
        sourceSections
            .map(section => {
                return [
                    `SOURCE SECTION: ${section.title}`,
                    sectionToText(section)
                ].join("\n");
            })
            .join("\n\n");


    for (
        let i = 0;
        i < outline.sections.length;
        i++
    ) {
        const planned =
            outline.sections[i];

        console.log(
            `  Theory ${i + 1}/${outline.sections.length}: ${planned.title}`
        );

        const prompt = `
You are writing a detailed educational section
for Lumina.

SECTION:
${planned.title}

TOPICS:
${planned.topics.join(", ")}

This section must teach the material, not summarize it.

Write enough detail that a student can understand
the topic independently.

Include, when supported by the source:

- definitions
- terminology
- intuition
- conceptual reasoning
- mathematical meaning
- step-by-step procedures
- relationships
- conditions
- interpretations
- important observations
- connections with previous ideas
- special cases
- practical meaning

If the source explains why something works,
explain that reasoning.

DEPTH REQUIREMENT:

Write approximately 7–10 substantial paragraphs.

Each paragraph should normally contain
roughly 60–120 words.

Do not pad the response with repetition.

Every paragraph must add meaningful educational
information.

Do not use Markdown.

Return ONLY JSON:

{
    "id": "${planned.id}",
    "title": "${planned.title}",
    "content": [
        {
            "type": "paragraph",
            "text": "Detailed educational explanation..."
        }
    ]
}

SOURCE:

${relevantSource}
`;

        const result =
            await callGemini({
                prompt
            });

        generatedSections.push(
            result
        );
    }

    return generatedSections;
}


/*
=========================================================
STAGE 3
FORMULAS
=========================================================
*/

async function generateFormulas({
    sourceText,
    title
}) {
    console.log(
        "\n[3/6] Extracting formulas..."
    );

    const prompt = `
You are extracting mathematical knowledge
for Lumina.

Concept:
${title}

Identify EVERY important:

- formula
- identity
- ratio
- equation
- mathematical relationship
- rule

supported by the source.

For each formula provide:

- unique ID
- meaningful name
- clean expression
- detailed explanation
- when it is useful
- what each quantity represents

Do not omit important formulas.

Do not invent unrelated formulas.

Return ONLY JSON:

{
    "formulas": [
        {
            "id": "formula-id",
            "name": "Formula name",
            "expression": "expression",
            "explanation": "Detailed explanation."
        }
    ]
}

SOURCE:

${sourceText}
`;

    const result =
        await callGemini({
            prompt
        });

    return result.formulas || [];
}


/*
=========================================================
STAGE 4
EXAMPLES
=========================================================
*/

async function generateExamples({
    sourceText,
    theory,
    title
}) {
    console.log(
        "\n[4/6] Generating worked examples..."
    );

    const theoryText =
        theory
            .map(section => {
                return [
                    section.title,
                    section.content
                        .map(item => item.text)
                        .join("\n")
                ].join("\n");
            })
            .join("\n\n");


    const prompt = `
You are creating the worked-example library
for Lumina.

Concept:
${title}

Create 10–14 high-quality worked examples.

The examples should cover different concepts
rather than repeating the same problem.

Include, when supported:

- basic understanding
- direct calculation
- formula application
- finding unknown quantities
- reverse problems
- multi-step reasoning
- interpretation
- application problems
- challenging cases
- common tricky situations

EVERY solution must be detailed.

Use this structure inside the solution:

1. Given information.
2. What needs to be found.
3. Identify the relevant concept.
4. Explain why it applies.
5. Write the formula or relationship.
6. Substitute the known values.
7. Perform intermediate calculations.
8. Obtain the result.
9. Interpret the answer.

Do not compress all steps into a single sentence.

Do not simply provide the final answer.

Do not invent unrelated mathematics.

Return ONLY JSON:

{
    "examples": [
        {
            "id": "example-id",
            "question": "Question...",
            "solution": "Detailed step-by-step solution..."
        }
    ]
}

SOURCE:

${sourceText}

THEORY:

${theoryText}
`;

    const result =
        await callGemini({
            prompt
        });

    return result.examples || [];
}


/*
=========================================================
STAGE 5
LEARNING LAYER
=========================================================
*/

async function generateLearningLayer({
    sourceText,
    theory,
    title
}) {
    console.log(
        "\n[5/6] Generating learning layer..."
    );

    const theoryText =
        theory
            .map(section => {
                return [
                    section.title,
                    section.content
                        .map(item => item.text)
                        .join("\n")
                ].join("\n");
            })
            .join("\n\n");


    const prompt = `
You are creating the deeper-learning layer
for Lumina.

Concept:
${title}

Create:

KEY IDEAS
----------

Create 10–15 concrete and meaningful ideas
that a student should remember.

MISCONCEPTIONS
--------------

Create 8–12 realistic misconceptions.

Each misconception should explain:

- what students commonly think
- why that thinking is wrong
- what the correct understanding is

EXPLORATIONS
------------

Create 6–10 deeper-learning explorations.

Possible types:

why
intuition
visualization
pattern
application
connection
what_if

These should encourage deeper thinking.

Do not invent unrelated material.

Return ONLY JSON:

{
    "key_ideas": [
        "..."
    ],

    "misconceptions": [
        "..."
    ],

    "explorations": [
        {
            "id": "exploration-id",
            "type": "why"
        }
    ]
}

SOURCE:

${sourceText}

THEORY:

${theoryText}
`;

    return await callGemini({
        prompt
    });
}


/*
=========================================================
EXPANSION STAGE
=========================================================
*/

async function expandConcept({
    concept,
    sourceText,
    title,
    round
}) {
    console.log(
        `\n[EXPANSION ${round}] Concept is below ${MIN_LINES} lines.`
    );

    console.log(
        "Asking Gemini to expand the weakest areas..."
    );


    const compactConcept =
        JSON.stringify(
            concept,
            null,
            2
        );


    const prompt = `
You are the quality-expansion engine for Lumina.

The generated educational concept is too short.

The target is 600–800 lines of meaningful JSON content.

Current concept:
${title}

Current JSON:

${compactConcept}

SOURCE:

${sourceText}

Your task is to expand the EXISTING concept.

IMPORTANT:

Do NOT rewrite the entire concept from scratch.

Do NOT remove existing useful content.

Do NOT add filler.

Do NOT repeat paragraphs.

Identify the areas that are currently too shallow.

Prioritize:

1. Theory sections with insufficient explanation.
2. Missing conceptual reasoning.
3. Missing explanations of mathematical relationships.
4. Examples that need more detailed reasoning.
5. Important source ideas that are not represented.
6. Missing misconceptions.
7. Missing useful learning insights.

THEORY:

Every theory section should contain approximately
7–10 substantial paragraphs where the source supports
that depth.

Expand explanations of:

- what
- why
- how
- when
- relationships
- interpretation
- reasoning

EXAMPLES:

Make solutions genuinely step-by-step.

Add examples only when they represent useful
mathematical situations supported by the source.

COVERAGE:

Look back at the source and identify important
material that the existing concept omitted.

Add that material.

QUALITY:

The final concept should read like a detailed
learning module, not an LLM summary.

Return ONLY the COMPLETE updated Lumina JSON object.

It MUST preserve this exact top-level structure:

{
    "id": "...",
    "title": "...",
    "subject": "...",
    "topic": "...",
    "section": "...",
    "difficulty": 1,
    "connections": {
        "prerequisites": [],
        "leads_to": [],
        "related": []
    },
    "theory": {
        "introduction": "...",
        "sections": []
    },
    "formulas": [],
    "examples": [],
    "key_ideas": [],
    "misconceptions": [],
    "explorations": [],
    "sources": []
}
`;

    return await callGemini({
        prompt,
        schema: LUMINA_SCHEMA
    });
}


/*
=========================================================
MAIN GENERATOR
=========================================================
*/

export async function generateConcept({
    source,
    conceptId,
    title,
    subject = "mathematics",
    topic = "trigonometry",
    section = "right-triangle-trigonometry",
    difficulty = 2,
    sourceId = "openstax"
}) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY environment variable is not set"
        );
    }


    const sourceText =
        sourceToText(source);

    const sourceSections =
        splitIntoSections(source);


    console.log(
        `Source contains ${source.content.length} blocks.`
    );

    console.log(
        `Detected ${sourceSections.length} source sections.`
    );


    /*
    -----------------------------------------------
    STAGE 1
    -----------------------------------------------
    */

    const outline =
        await generateOutline({
            sourceText,
            title
        });


    /*
    -----------------------------------------------
    STAGE 2
    -----------------------------------------------
    */

    const theorySections =
        await generateTheory({
            sourceSections,
            outline
        });


    /*
    -----------------------------------------------
    STAGE 3
    -----------------------------------------------
    */

    const formulas =
        await generateFormulas({
            sourceText,
            title
        });


    /*
    -----------------------------------------------
    STAGE 4
    -----------------------------------------------
    */

    const examples =
        await generateExamples({
            sourceText,
            theory: theorySections,
            title
        });


    /*
    -----------------------------------------------
    STAGE 5
    -----------------------------------------------
    */

    const learning =
        await generateLearningLayer({
            sourceText,
            theory: theorySections,
            title
        });


    /*
    -----------------------------------------------
    INITIAL OBJECT
    -----------------------------------------------
    */

    let concept = {
        id: conceptId,

        title,

        subject,

        topic,

        section,

        difficulty,

        connections: {
            prerequisites: [],
            leads_to: [],
            related: []
        },

        theory: {
            introduction:
                theorySections.length > 0 &&
                theorySections[0].content?.length > 0
                    ? theorySections[0]
                        .content[0]
                        .text
                    : `An introduction to ${title}.`,

            sections:
                theorySections
        },

        formulas,

        examples,

        key_ideas:
            learning.key_ideas || [],

        misconceptions:
            learning.misconceptions || [],

        explorations:
            learning.explorations || [],

        sources: [
            sourceId
        ]
    };


    /*
    -----------------------------------------------
    QUALITY EXPANSION LOOP
    -----------------------------------------------
    */

    for (
        let round = 1;
        round <= MAX_EXPANSION_ROUNDS;
        round++
    ) {
        const currentJson =
            JSON.stringify(
                concept,
                null,
                2
            );

        const currentLines =
            currentJson.split("\n").length;


        console.log(
            `\nCurrent JSON lines: ${currentLines}`
        );


        if (currentLines >= MIN_LINES) {
            console.log(
                "Minimum content target reached."
            );

            break;
        }


        concept =
            await expandConcept({
                concept,
                sourceText,
                title,
                round
            });
    }


    /*
    -----------------------------------------------
    FINAL MEASUREMENT
    -----------------------------------------------
    */

    const finalJson =
        JSON.stringify(
            concept,
            null,
            2
        );

    const lineCount =
        finalJson.split("\n").length;


    console.log(
        "\n========================================"
    );

    console.log(
        "CONTENT GENERATION COMPLETE"
    );

    console.log(
        "========================================"
    );

    console.log(
        `Theory sections: ${
            concept.theory.sections.length
        }`
    );

    console.log(
        `Formulas: ${
            concept.formulas.length
        }`
    );

    console.log(
        `Examples: ${
            concept.examples.length
        }`
    );

    console.log(
        `Key ideas: ${
            concept.key_ideas.length
        }`
    );

    console.log(
        `Misconceptions: ${
            concept.misconceptions.length
        }`
    );

    console.log(
        `Explorations: ${
            concept.explorations.length
        }`
    );

    console.log(
        `JSON lines: ${lineCount}`
    );


    if (lineCount < MIN_LINES) {
        console.log(
            `WARNING: Still below ${MIN_LINES} lines after expansion.`
        );
    }

    if (lineCount > MAX_LINES) {
        console.log(
            `WARNING: Above ${MAX_LINES} lines.`
        );
    }


    return concept;
}