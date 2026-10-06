import { Fragment } from "react";

// Renders the model's plain-text answer: paragraphs, "- " bullet lists and
// **bold**. Built from text only, so nothing in an answer can become HTML.
export function FormattedText({ text }: { text: string }) {
  const blocks: ({ kind: "p"; lines: string[] } | { kind: "ul"; items: string[] })[] = [];
  let paragraph: string[] | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const last = blocks[blocks.length - 1];

    if (bullet) {
      paragraph = null;
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (!line.trim()) {
      paragraph = null;
    } else if (paragraph) {
      paragraph.push(line);
    } else {
      paragraph = [line];
      blocks.push({ kind: "p", lines: paragraph });
    }
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.kind === "ul" ? (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                <Inline text={line} />
              </Fragment>
            ))}
          </p>
        )
      )}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}
