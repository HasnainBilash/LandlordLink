import type { AiProvider, ToolCall } from "./types";

// A stand-in for the real model, for automated tests (AI_PROVIDER=fake):
// they run offline and don't use up the free quota. It picks a tool from
// keywords in the message and answers with the tool's raw result, which is
// enough to test everything around the model (tools, scoping, limits, UI).
function pickTool(message: string): ToolCall | null {
  const text = message.toLowerCase();

  // Changes: "record 5000 for Nusrat", "approve Samira Khan",
  // "reject Tania Parvin", "post notice to Green Valley: Lift repair".
  const payment = message.match(/^record\s+([\d,]+)\s+for\s+(.+)$/i);
  if (payment) {
    return { id: "fake", name: "record_payment", args: { amount: Number(payment[1].replace(/,/g, "")), tenant: payment[2] } };
  }

  const decision = message.match(/^(approve|reject)\s+(.+)$/i);
  if (decision) {
    return { id: "fake", name: `${decision[1].toLowerCase()}_request`, args: { applicant: decision[2] } };
  }

  const notice = message.match(/^post notice to\s+(.+?):\s*(.+)$/i);
  if (notice) {
    return { id: "fake", name: "post_notice", args: { building: notice[1], title: notice[2].slice(0, 60), message: notice[2] } };
  }

  const flat = text.match(/flat\s+([a-z]?\d+)(?:\s+in\s+(.+))?/);

  if (flat) {
    return { id: "fake", name: "get_flat", args: { flat: flat[1], building: flat[2]?.replace(/[?.!]+$/, "") } };
  }

  if (/owe|unpaid|paid/.test(text)) return { id: "fake", name: "list_unpaid", args: {} };
  if (/request/.test(text)) return { id: "fake", name: "list_requests", args: {} };
  if (/notice/.test(text)) return { id: "fake", name: "list_notices", args: {} };
  if (/overview|building|occupan/.test(text)) return { id: "fake", name: "get_overview", args: {} };

  return null;
}

export function createFakeProvider(): AiProvider {
  return {
    startChat() {
      return {
        async send(input) {
          if ("text" in input) {
            const call = pickTool(input.text);

            return call
              ? { text: "", toolCalls: [call] }
              : { text: "(fake assistant) I can only look things up.", toolCalls: [] };
          }

          return {
            text: input.toolResults.map((result) => JSON.stringify(result.output)).join("\n"),
            toolCalls: [],
          };
        },
      };
    },
  };
}
