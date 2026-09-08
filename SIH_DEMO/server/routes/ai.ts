import { Hono } from "hono";

import {
  getConceptById,
  getContentElement
} from "../services/content";

import {
  askGemini,
  type GeminiMessage
} from "../services/gemini";


type Bindings = {
  GEMINI_API_KEY: string;
};


const aiRouter = new Hono<{
  Bindings: Bindings;
}>();


aiRouter.post("/chat", async (c) => {
  try {
    const body = await c.req.json<{
      conceptId?: string;
      contentId?: string;
      mode?: string;
      message?: string;
      history?: GeminiMessage[];
    }>();


    const {
      conceptId,
      contentId,
      mode = "normal",
      message,
      history = []
    } = body;


    if (!conceptId) {
      return c.json(
        {
          error: "conceptId is required"
        },
        400
      );
    }


    if (!message) {
      return c.json(
        {
          error: "message is required"
        },
        400
      );
    }


    const concept = getConceptById(conceptId);


    if (!concept) {
      return c.json(
        {
          error: "Concept not found"
        },
        404
      );
    }


    let focusedContent = null;


    if (contentId) {
      focusedContent = getContentElement(
        conceptId,
        contentId
      );
    }


    const context = {
      concept: {
        id: concept.id,
        title: concept.title,
        subject: concept.subject,
        topic: concept.topic,
        difficulty: concept.difficulty
      },

      focusedContent,

      theory: concept.theory,

      formulas: concept.formulas,

      examples: concept.examples,

      keyIdeas: concept.key_ideas,

      misconceptions: concept.misconceptions
    };


    const systemInstruction = `
You are the AI tutor inside an interactive education platform.

Your job is to help the student understand the concept they are currently studying.

IMPORTANT RULES:

1. Teach for understanding, not memorization.
2. Use the provided learning material as the primary source of truth.
3. Do not invent facts that contradict the provided material.
4. Adapt your explanation to the requested mode.
5. Never assume the student already understands something simply because it is mathematically elementary.
6. If the student asks "why", explain the reasoning rather than merely repeating the definition.
7. If the student asks for an example, create a clear example appropriate to the current concept.
8. Do not unnecessarily introduce advanced topics outside the current concept.
9. Keep the student's current context in mind.
10. If the question is unrelated to the current concept, answer briefly and guide the student back toward the relevant concept.

Requested explanation mode:
${mode}

Current learning context:

${JSON.stringify(context, null, 2)}
`;


    const apiKey = c.env.GEMINI_API_KEY;


    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return c.json(
        {
          error: "AI service is not configured"
        },
        500
      );
    }


    const answer = await askGemini(
      apiKey,
      systemInstruction,
      history,
      message
    );


    return c.json({
      answer
    });


  } catch (error) {

  console.error("AI route error:", error);

  return c.json(
    {
      error: error instanceof Error
        ? error.message
        : "Failed to generate AI response"
    },
    500
  );
}
});


export default aiRouter;