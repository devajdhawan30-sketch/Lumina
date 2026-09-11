const GEMINI_MODEL = "gemini-3.6-flash";

export type GeminiMessage = {
  role: "user" | "model";
  text: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;

  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};

export async function askGemini(
  env: any, 
  systemInstruction: string,
  history: GeminiMessage[],
  userMessage: string
) {
  const GEMINI_API_URL = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/path-verse/google-ai-studio/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const contents = [
    ...history.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.text
        }
      ]
    })),

    {
      role: "user",
      parts: [
        {
          text: userMessage
        }
      ]
    }
  ];

  // 1. List your key aliases
  const aliases = ["key-1", "key-2", "key-3","key-4","key-5"];
  
  // 2. Shuffle aliases so each request starts with a different key
  const shuffledAliases = [...aliases].sort(() => Math.random() - 0.5);

  let lastError: any = null;

  // 3. Try keys one by one until one succeeds
  for (const alias of shuffledAliases) {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-aig-authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          "cf-aig-byok-alias": alias
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 500
          }
        })
      });

      const rawResponse = await response.text();

      // If this specific key is rate-limited (429), switch to the next key
      if (response.status === 429) {
        console.warn(`[AI Gateway] ${alias} hit 429 quota. Trying next key...`);
        lastError = new Error(`Key ${alias} rate-limited: ${rawResponse}`);
        continue;
      }

      let data: GeminiResponse;
      try {
        data = JSON.parse(rawResponse) as GeminiResponse;
      } catch {
        throw new Error(`Gemini returned non-JSON response: ${rawResponse}`);
      }

      if (!response.ok) {
        throw new Error(`Gemini ${response.status}: ${data.error?.message || rawResponse}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Gemini returned no text. Raw response: ${rawResponse}`);
      }

      // Successful response received
      return text;

    } catch (err: any) {
      lastError = err;
      if (err.message?.includes("429")) {
        console.warn(`[AI Gateway] Caught 429 on ${alias}, switching to next key...`);
        continue;
      }
      throw err;
    }
  }

  // If all keys in the list failed with 429
  throw new Error(
    "All AI keys are temporarily busy. Please wait 15–20 seconds and try again."
  );
}