import { ApiError, GoogleGenAI, type Content, type GenerateContentConfig } from "@google/genai";

import { AiBusyError, type AiProvider, type ModelTurn, type ToolCall } from "./types";

// Tried in order: when one is busy, rate limited or retired, the next one
// answers instead (each model has its own free-tier quota). Fast models
// first; override with GEMINI_MODEL="model-a,model-b".
export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

// Overloaded or a passing server error: worth one retry on the same model.
const RETRY_STATUSES = new Set([500, 503]);
// Worth trying the next model: also rate limited (429) or retired (404).
const NEXT_MODEL_STATUSES = new Set([404, 429, 500, 503]);

async function generateWithRetry<T>(model: string, request: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof ApiError) || !NEXT_MODEL_STATUSES.has(error.status)) throw error;

      if (attempt === 1 && RETRY_STATUSES.has(error.status)) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      // Google names the exhausted quota, e.g. "...PerDayPerProject...".
      const daily = error.status === 429 && /PerDay/i.test(error.message);

      throw new AiBusyError(`${model} unavailable (${error.status})`, daily, { cause: error });
    }
  }
}

export function createGeminiProvider(apiKey: string, model: string): AiProvider {
  const ai = new GoogleGenAI({ apiKey });

  return {
    startChat({ system, history, tools }) {
      const contents: Content[] = history.map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.text }],
      }));

      const config: GenerateContentConfig = {
        systemInstruction: system,
        temperature: 0.2,
        maxOutputTokens: 2048,
        tools: [
          {
            functionDeclarations: tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parametersJsonSchema: tool.parameters,
            })),
          },
        ],
      };

      async function generate(): Promise<ModelTurn> {
        const response = await generateWithRetry(model, () =>
          ai.models.generateContent({ model, contents, config })
        );

        const content = response.candidates?.[0]?.content;

        // Keep the model's turn exactly as returned: newer models attach
        // "thought signatures" that must come back with the tool results.
        if (content) contents.push(content);

        const parts = content?.parts ?? [];
        const toolCalls: ToolCall[] = parts.flatMap((part) =>
          part.functionCall?.name
            ? [{ id: part.functionCall.id, name: part.functionCall.name, args: part.functionCall.args ?? {} }]
            : []
        );

        return {
          text: parts
            .filter((part) => part.text && !part.thought)
            .map((part) => part.text)
            .join(""),
          toolCalls,
        };
      }

      return {
        send(input) {
          if ("text" in input) {
            contents.push({ role: "user", parts: [{ text: input.text }] });
          } else {
            contents.push({
              role: "user",
              parts: input.toolResults.map(({ call, output }) => ({
                functionResponse: {
                  id: call.id,
                  name: call.name,
                  // Gemini reads "error" as a failed call, "output" as a result.
                  response: isErrorOutput(output) ? { error: output.error } : { output },
                },
              })),
            });
          }

          return generate();
        },
      };
    },
  };
}

function isErrorOutput(output: unknown): output is { error: string } {
  return typeof output === "object" && output !== null && "error" in output;
}
