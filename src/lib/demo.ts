// The public demo: one landlord and one tenant anyone can sign in as from
// the landing page ("Try the demo"). Their data comes from
// lib/demo-data.ts, rebuilt every night and by `npm run db:seed-demo`.
// The password is not a secret — the demo buttons sign visitors in with it.
export const DEMO_PASSWORD = "11111111";

export const DEMO_LANDLORD = {
  email: "farhan.ahmed@example.com",
  name: "Farhan Ahmed",
} as const;

export const DEMO_TENANT = {
  email: "nusrat.demo@example.com",
  name: "Nusrat Jahan",
} as const;

export function isDemoEmail(email: string | null | undefined) {
  return email === DEMO_LANDLORD.email || email === DEMO_TENANT.email;
}
