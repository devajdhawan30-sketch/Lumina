import { Hono } from "hono";

import {
  getConceptById,
  getContentElement
} from "../services/content";

import {
  askGemini,
  type GeminiMessage
} from "../services/gemini";

// 1. Updated Bindings to match your new .dev.vars
type Bindings = {
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
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

    const normalInstructions = `
You are the AI tutor inside an interactive education platform.

Your job is to help the student understand the concept they are currently studying.

IMPORTANT RULES:
1. Teach for understanding, not memorization.
2. Use the provided learning material as the primary source of truth.
3. Do not invent facts that contradict the provided material.
4. Adapt your explanation to the student's level and question.
5. Never assume the student already understands something simply because it is elementary.
6. If the student asks "why", explain the reasoning rather than merely repeating the definition.
7. If the student asks for an example, create a clear example appropriate to the current concept.
8. Do not unnecessarily introduce advanced topics outside the current concept.
9. Keep the student's current context in mind.
10. If the question is unrelated, answer briefly and guide the student back to the relevant concept.
11. try to complete the answer within 2000 token limit and do not leave them incomplete
`;

    const socraticInstructions = `
You are a Socratic learning coach inside an interactive education platform.

The goal is NOT to give the student the answer immediately. Your job is to make the student explain, reason, connect ideas, and correct misconceptions.

Follow this protocol:
1. Ask the student to explain the concept or solve the current problem in their own words.
2. Ask ONE focused probing question at a time. Do not overwhelm them with a list of questions.
3. Do not reveal the correct answer before the student has had a chance to reason.
4. If the student's reasoning is correct, acknowledge the specific part that is correct and probe one level deeper.
5. If the reasoning is partially correct, identify the gap without simply filling it in. Ask a question that helps the student discover the missing link.
6. If the reasoning is wrong, do not shame the student. Point to the conflicting assumption and ask them to reconsider it.
7. Use the supplied learning material as the primary source of truth.
8. After several exchanges, or when the student explicitly asks for an assessment, give a concise grasp assessment:
   - Overall grasp: Strong / Developing / Needs work
   - What they understand
   - What is shaky or missing
   - One concrete next step
9. Never pretend to assess understanding from a single sentence unless the student has actually demonstrated reasoning.
10. Keep the conversation focused on the current concept.

When the student asks for the answer directly, briefly explain that Socratic mode is designed to test their own reasoning, then ask a guiding question instead.
`;

    const systemInstruction = `
${mode === "socratic" ? socraticInstructions : normalInstructions}

Requested mode:
${mode}

Current learning context:
${JSON.stringify(context, null, 2)}
`;

    // 2. Updated error checking for Cloudflare environment variables
    if (!c.env.CLOUDFLARE_API_TOKEN || !c.env.CLOUDFLARE_ACCOUNT_ID) {
      console.error("Cloudflare Gateway credentials missing");

      return c.json(
        {
          error: "AI service is not configured"
        },
        500
      );
    }

    // 3. Pass the entire 'c.env' object to askGemini
    const recentHistory = history.slice(-6);
    const answer = await askGemini(
      c.env,
      systemInstruction,
      recentHistory,
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