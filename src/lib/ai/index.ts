import { createFakeProvider } from "./fake";
import { createGeminiProvider, DEFAULT_GEMINI_MODELS } from "./gemini";
import type { AiProvider } from "./types";

// The AI providers the assistant may use, in order of preference: when one
// is busy the next one answers. Empty when none is configured (the
// assistant then says it isn't set up). AI_PROVIDER=fake is for automated
// tests only.
export function getAiProviders(): AiProvider[] {
  if (process.env.AI_PROVIDER === "fake") return [createFakeProvider()];

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return [];

  const models = process.env.GEMINI_MODEL?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return (models?.length ? models : DEFAULT_GEMINI_MODELS).map((model) =>
    createGeminiProvider(apiKey, model)
  );
}
