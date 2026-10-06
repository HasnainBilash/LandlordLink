import { describe, expect, it, vi } from "vitest";

import { AiBusyError, type AiProvider, type ModelTurn } from "./types";

// The assistant loop without a database or a real model: tools and Prisma
// are replaced, providers are scripted.
vi.mock("./tools", () => ({
  TOOL_SPECS: [],
  runTool: vi.fn(async () => ({ owes: "৳12,500" })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { assistantAction: { updateMany: vi.fn() } },
}));

const { runAssistant, FALLBACK_REPLY } = await import("./assistant");
const { runTool } = await import("./tools");

const landlord = { id: "landlord-1", name: "Farhan Ahmed" };

// A provider that answers with the given turns, in order.
function scripted(turns: ModelTurn[]): AiProvider {
  return {
    startChat: () => {
      let index = 0;
      return { send: async () => turns[index++] };
    },
  };
}

function busy(daily = false): AiProvider {
  return {
    startChat: () => ({
      send: async () => {
        throw new AiBusyError("busy", daily);
      },
    }),
  };
}

describe("runAssistant", () => {
  it("runs the tools the model asks for, then returns its answer", async () => {
    const provider = scripted([
      { text: "", toolCalls: [{ name: "find_tenant", args: { name: "Nusrat" } }] },
      { text: "Nusrat Jahan owes ৳12,500.", toolCalls: [] },
    ]);

    const answer = await runAssistant({ providers: [provider], landlord, history: [], message: "How much does Nusrat owe?" });

    expect(answer).toEqual({ reply: "Nusrat Jahan owes ৳12,500.", actions: [] });
    expect(runTool).toHaveBeenCalledWith(
      { name: "find_tenant", args: { name: "Nusrat" } },
      expect.objectContaining({ ownerId: "landlord-1" })
    );
  });

  it("moves on to the next provider when one is busy", async () => {
    const answer = await runAssistant({
      providers: [busy(), scripted([{ text: "Hello from the backup model.", toolCalls: [] }])],
      landlord,
      history: [],
      message: "Hi",
    });

    expect(answer.reply).toBe("Hello from the backup model.");
  });

  it("reports a daily limit only when every provider hit it", async () => {
    await expect(
      runAssistant({ providers: [busy(true), busy(true)], landlord, history: [], message: "Hi" })
    ).rejects.toMatchObject({ daily: true });

    await expect(
      runAssistant({ providers: [busy(true), busy(false)], landlord, history: [], message: "Hi" })
    ).rejects.toMatchObject({ daily: false });
  });

  it("falls back to a polite reply when the model says nothing", async () => {
    const answer = await runAssistant({
      providers: [scripted([{ text: "  ", toolCalls: [] }])],
      landlord,
      history: [],
      message: "?",
    });

    expect(answer.reply).toBe(FALLBACK_REPLY);
  });
});
