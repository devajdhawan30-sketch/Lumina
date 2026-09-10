export const LUMINA_SCHEMA = {
    type: "object",
    additionalProperties: false,

    required: [
        "id",
        "title",
        "subject",
        "topic",
        "section",
        "difficulty",
        "connections",
        "theory",
        "formulas",
        "examples",
        "key_ideas",
        "misconceptions",
        "explorations",
        "sources"
    ],

    properties: {
        id: { type: "string" },
        title: { type: "string" },
        subject: { type: "string" },
        topic: { type: "string" },
        section: { type: "string" },

        difficulty: {
            type: "integer",
            minimum: 1,
            maximum: 5
        },

        connections: {
            type: "object",
            additionalProperties: false,
            required: [
                "prerequisites",
                "leads_to",
                "related"
            ],
            properties: {
                prerequisites: {
                    type: "array",
                    items: { type: "string" }
                },
                leads_to: {
                    type: "array",
                    items: { type: "string" }
                },
                related: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        },

        theory: {
            type: "object",
            additionalProperties: false,
            required: [
                "introduction",
                "sections"
            ],
            properties: {
                introduction: { type: "string" },

                sections: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: [
                            "id",
                            "title",
                            "content"
                        ],
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },

                            content: {
                                type: "array",
                                items: {
                                    type: "object",
                                    additionalProperties: false,
                                    required: [
                                        "type",
                                        "text"
                                    ],
                                    properties: {
                                        type: {
                                            type: "string",
                                            enum: ["paragraph"]
                                        },
                                        text: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        formulas: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: [
                    "id",
                    "name",
                    "expression",
                    "explanation"
                ],
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    expression: { type: "string" },
                    explanation: { type: "string" }
                }
            }
        },

        examples: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: [
                    "id",
                    "question",
                    "solution"
                ],
                properties: {
                    id: { type: "string" },
                    question: { type: "string" },
                    solution: { type: "string" }
                }
            }
        },

        key_ideas: {
            type: "array",
            items: { type: "string" }
        },

        misconceptions: {
            type: "array",
            items: { type: "string" }
        },

        explorations: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: [
                    "id",
                    "type"
                ],
                properties: {
                    id: { type: "string" },
                    type: { type: "string" }
                }
            }
        },

        sources: {
            type: "array",
            items: { type: "string" }
        }
    }
};