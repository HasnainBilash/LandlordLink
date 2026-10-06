"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { ArrowDown, ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cancelAssistantAction, confirmAssistantAction } from "@/actions/assistant/assistant-actions";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  ActionCard,
  ConfirmActionsDialog,
  describeOutcomes,
  type ChatAction,
} from "./assistant-actions";
import { FormattedText } from "./formatted-text";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  // Error notes are shown but never sent back to the model.
  error?: boolean;
  // Changes the assistant prepared for the landlord to confirm.
  actions?: ChatAction[];
};

const SUGGESTIONS = [
  "Who owes me rent right now?",
  "How full are my buildings?",
  "Any new requests?",
  "এই মাসের ভাড়া কে কে দেয়নি?",
];

const MAX_LENGTH = 1000;

// The landlord's AI assistant: a side panel opened from the header. It
// lives in the app shell, so the conversation stays while moving between
// pages (it is not saved anywhere else).
export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  // The message whose prepared changes are in the confirm popup.
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [deciding, setDeciding] = useState(false);
  const nextId = useRef(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior });
  }

  // The panel's content is created afresh each time it opens, so start at
  // the latest message rather than the top.
  const attachScroller = useCallback((node: HTMLDivElement | null) => {
    scrollerRef.current = node;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  // Follow new messages as they arrive.
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, pending]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    setAtBottom(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48);
  }

  function add(message: Omit<Message, "id">) {
    nextId.current += 1;
    const id = nextId.current;
    setMessages((current) => [...current, { ...message, id }]);
    return id;
  }

  function updateAction(messageId: number, actionId: string, change: Partial<ChatAction>) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              actions: message.actions?.map((action) =>
                action.id === actionId ? { ...action, ...change } : action
              ),
            }
          : message
      )
    );
  }

  function pendingActions(messageId: number | null) {
    return messages.find((message) => message.id === messageId)?.actions?.filter((action) => action.status === "pending") ?? [];
  }

  // Runs the changes one by one, each through the app's own checks.
  async function confirmPending() {
    if (reviewingId === null) return;

    const messageId = reviewingId;
    setDeciding(true);

    for (const action of pendingActions(messageId)) {
      updateAction(messageId, action.id, { status: "running" });

      try {
        const result = await confirmAssistantAction(action.id);
        updateAction(messageId, action.id, { status: result.success ? "done" : "failed", result: result.message });

        if (result.success) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        updateAction(messageId, action.id, {
          status: "failed",
          result: "Couldn't reach the app. Check the page before trying again.",
        });
      }
    }

    setDeciding(false);
    setReviewingId(null);
  }

  async function cancelPending() {
    if (reviewingId === null) return;

    const messageId = reviewingId;
    const actions = pendingActions(messageId);

    setReviewingId(null);

    for (const action of actions) {
      updateAction(messageId, action.id, { status: "cancelled", result: "Nothing was changed." });
      await cancelAssistantAction(action.id).catch(() => undefined);
    }
  }

  function startNewChat() {
    // Changes nobody decided on are cancelled, not left waiting.
    for (const message of messages) {
      for (const action of message.actions ?? []) {
        if (action.status === "pending") cancelAssistantAction(action.id).catch(() => undefined);
      }
    }

    setMessages([]);
    setAtBottom(true);
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    // Recent messages give the model context, including what became of
    // changes it prepared; long answers are shortened.
    const history = messages
      .filter((message) => !message.error)
      .slice(-10)
      .map((message) => ({
        role: message.role,
        text: (message.actions?.length
          ? `${message.text}\n${describeOutcomes(message.actions)}`
          : message.text
        ).slice(0, 2000),
      }));

    add({ role: "user", text: question });
    setInput("");
    setPending(true);
    setAtBottom(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const data = await response.json().catch(() => ({}));

      if (typeof data.remaining === "number") setRemaining(data.remaining);

      if (response.ok && typeof data.reply === "string") {
        const actions: ChatAction[] = Array.isArray(data.actions)
          ? data.actions.map((action: Omit<ChatAction, "status">) => ({
              id: action.id,
              title: action.title,
              details: action.details,
              status: "pending",
            }))
          : [];

        const id = add({ role: "assistant", text: data.reply, actions });

        // Prepared changes pop up for confirmation straight away.
        if (actions.length > 0) setReviewingId(id);
      } else {
        add({ role: "assistant", text: data.error ?? "Something went wrong. Please try again.", error: true });
      }
    } catch {
      add({
        role: "assistant",
        text: "Couldn't reach the assistant. Check your connection and try again.",
        error: true,
      });
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  // Enter sends; Shift+Enter adds a new line.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask(input);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="gap-1.5" aria-label="Ask AI" />}>
        <Sparkles className="text-primary" />
        <span className="hidden sm:inline">Ask AI</span>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle className="flex items-center gap-2.5">
              <span className="bg-brand-gradient flex size-8 items-center justify-center rounded-xl text-white">
                <Sparkles className="size-4" />
              </span>
              Assistant
            </SheetTitle>

            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={startNewChat} disabled={pending || deciding}>
                <RotateCcw />
                New chat
              </Button>
            )}
          </div>
          <SheetDescription>
            Ask about your buildings, tenants and rent, or have it record a
            payment — in English or Bangla.
          </SheetDescription>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={attachScroller}
            onScroll={onScroll}
            data-testid="assistant-messages"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 ? (
              <Suggestions onPick={ask} />
            ) : (
              <div className="space-y-4" aria-live="polite">
                {messages.map((message) => (
                  <Bubble key={message.id} message={message} onReview={() => setReviewingId(message.id)} />
                ))}
                {pending && <Thinking />}
              </div>
            )}
          </div>

          {!atBottom && messages.length > 0 && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Jump to the latest message"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background shadow-md"
            >
              <ArrowDown />
            </Button>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t p-3">
          <div className="flex items-end gap-2 rounded-2xl border bg-background p-1.5 transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_LENGTH}
              rows={1}
              placeholder="Ask something…"
              aria-label="Message the assistant"
              className="field-sizing-content max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl"
              disabled={pending || !input.trim()}
              aria-label="Send"
            >
              <ArrowUp />
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            AI can make mistakes — check important numbers.
            {remaining !== null && ` ${remaining} messages left today.`}
          </p>
        </form>

        <ConfirmActionsDialog
          actions={pendingActions(reviewingId)}
          open={reviewingId !== null}
          deciding={deciding}
          onConfirm={confirmPending}
          onCancel={cancelPending}
          onDismiss={() => setReviewingId(null)}
        />
      </SheetContent>
    </Sheet>
  );
}

function Suggestions({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5 pt-4 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
          <Sparkles className="size-5" />
        </span>
        <p className="font-semibold">How can I help?</p>
        <p className="text-sm text-muted-foreground">
          I can look up rent, dues, flats, requests and notices — and record
          payments, answer requests or post notices once you confirm.
        </p>
      </div>

      <div className="grid gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="rounded-xl border bg-card px-3.5 py-2.5 text-left text-sm transition hover:border-primary/40 hover:bg-accent/50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
      <Sparkles className="size-3.5" />
    </span>
  );
}

function Bubble({ message, onReview }: { message: Message; onReview: () => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <AssistantAvatar />
      <div className="max-w-[85%] min-w-0 space-y-2">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md px-3.5 py-2 text-sm",
            message.error ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-muted"
          )}
        >
          <FormattedText text={message.text} />
        </div>

        {message.actions?.map((action) => (
          <ActionCard key={action.id} action={action} onReview={onReview} />
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2.5" role="status">
      <AssistantAvatar />
      <span className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-muted px-3.5 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="sr-only">Thinking…</span>
      </span>
    </div>
  );
}
