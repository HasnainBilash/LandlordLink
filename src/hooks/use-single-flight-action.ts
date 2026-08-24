"use client";

import { useCallback, useRef, useState } from "react";

// Guards an async action against double-submission (e.g. a fast double
// click firing the handler twice before React re-renders the disabled
// button). The ref check is synchronous, so it blocks re-entrancy even
// before `isPending` reaches the DOM.
export function useSingleFlightAction<Args extends unknown[], Result>(
  action: (...args: Args) => Result | Promise<Result>
) {
  const isRunningRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      if (isRunningRef.current) {
        return undefined;
      }

      isRunningRef.current = true;
      setIsPending(true);

      try {
        return await action(...args);
      } finally {
        isRunningRef.current = false;
        setIsPending(false);
      }
    },
    [action]
  );

  return { run, isPending };
}
