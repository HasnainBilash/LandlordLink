// Provider-neutral shapes for the AI assistant, so the AI provider
// (Gemini today) can be swapped without touching the tools or the chat UI.

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ToolSpec = {
  name: string;
  description: string;
  // JSON Schema of the tool's arguments (an "object" schema).
  parameters: Record<string, unknown>;
};

export type ToolCall = {
  id?: string;
  name: string;
  args: Record<string, unknown>;
};

export type ToolResult = {
  call: ToolCall;
  output: unknown;
};

// One reply from the model: text for the landlord, and/or tools it wants
// called before it answers.
export type ModelTurn = {
  text: string;
  toolCalls: ToolCall[];
};

export interface AiChat {
  // First the landlord's message, then the results of the tools the model
  // asked for, until it answers with plain text.
  send(input: { text: string } | { toolResults: ToolResult[] }): Promise<ModelTurn>;
}

export interface AiProvider {
  startChat(options: {
    system: string;
    history: ChatMessage[];
    tools: ToolSpec[];
  }): AiChat;
}

// The model can't answer right now (rate limited, overloaded or retired);
// another model may still work. `daily` = the day's free quota is used up.
export class AiBusyError extends Error {
  constructor(
    message: string,
    readonly daily = false,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
