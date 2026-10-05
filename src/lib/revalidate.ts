import { revalidatePath } from "next/cache";

// Every page is rendered per request (they all depend on the session),
// so there is no data cache to target precisely. Revalidating the root
// layout makes the server action's response carry the refreshed current
// page and clears the client router cache, so sidebar badges and every
// other page show fresh data on the next visit.
export function revalidateApp() {
  revalidatePath("/", "layout");
}
