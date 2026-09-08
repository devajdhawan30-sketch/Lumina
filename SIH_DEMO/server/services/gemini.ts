const GEMINI_MODEL = "gemini-3.6-flash";

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  apiKey: string,
  systemInstruction: string,
  history: GeminiMessage[],
  userMessage: string
) {
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

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
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
        maxOutputTokens: 1000
      }
    })
  });

  const rawResponse = await response.text();

  console.log("Gemini HTTP status:", response.status);
  console.log("Gemini raw response:", rawResponse);

  let data: GeminiResponse;

  try {
    data = JSON.parse(rawResponse) as GeminiResponse;
  } catch {
    throw new Error(
      `Gemini returned non-JSON response: ${rawResponse}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Gemini ${response.status}: ${
        data.error?.message || rawResponse
      }`
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      `Gemini returned no text. Raw response: ${rawResponse}`
    );
  }

  return text;
}