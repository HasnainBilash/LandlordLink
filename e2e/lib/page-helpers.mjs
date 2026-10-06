// Browser helpers shared by the suites.

const visible = (locator, timeout = 4000) =>
  locator.first().waitFor({ timeout }).then(
    () => true,
    () => false
  );

// Opens a "⋯" menu, picks an item and waits for what it opens (e.g. a
// confirmation dialog). On a busy machine (CI) a click right after a page
// load can be lost, so it tries up to 3 times — and logs when it had to,
// so a real problem would still show up in the logs.
export async function openFromMenu(page, { menu, item, opens }) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.getByRole("button", { name: menu }).click();
    const entry = page.getByRole("menuitem", { name: item });

    if (await visible(entry)) {
      await entry.click();

      if (await visible(opens)) {
        if (attempt > 1) console.log(`note: "${menu}" → "${item}" needed ${attempt} tries`);
        return;
      }
    }

    // Close whatever did open before trying again.
    await page.keyboard.press("Escape");
  }

  throw new Error(`"${menu}" → "${item}" didn't open after 3 tries`);
}

// One line about the page when a step fails — where it was, what was
// open, any toasts — so a failure on CI can be understood from the log.
export async function describePage(page) {
  try {
    return await page.evaluate(() => {
      const text = (element) => element?.textContent?.replace(/\s+/g, " ").trim().slice(0, 80);
      const open = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[role="menu"]')].map(
        (element) => `${element.getAttribute("role")} "${text(element)?.slice(0, 40) ?? ""}"`
      );
      const toasts = [...document.querySelectorAll("[data-sonner-toast]")].map(text);

      return `page: ${location.pathname}${location.search} · h1: ${text(document.querySelector("h1")) ?? "none"} · open: ${open.join(", ") || "nothing"} · toasts: ${toasts.join(" | ") || "none"}`;
    });
  } catch (error) {
    return `page: unavailable (${String(error.message).split("\n")[0]})`;
  }
}
