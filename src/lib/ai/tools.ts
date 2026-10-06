import { READ_TOOLS } from "./read-tools";
import type { ToolContext } from "./tool-kit";
import type { ToolCall, ToolSpec } from "./types";
import { WRITE_TOOLS } from "./write-tools";

// Everything the assistant can do: look things up (read-tools.ts) and
// prepare changes for the landlord to confirm (write-tools.ts).
const TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];

export const TOOL_SPECS: ToolSpec[] = TOOLS.map((tool) => tool.spec);

export async function runTool(call: ToolCall, context: ToolContext): Promise<unknown> {
  const tool = TOOLS.find((candidate) => candidate.spec.name === call.name);

  if (!tool) return { error: `There is no tool called ${call.name}.` };

  try {
    return await tool.execute(call.args, context);
  } catch (error) {
    console.error(`Assistant tool ${call.name} failed`, error);
    return { error: "That didn't work. Please try again." };
  }
}
