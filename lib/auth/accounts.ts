import { Actor, actors } from "../domain/model";
// Demo-only credentials. Replace with a database lookup when one is integrated.
export const demoPassword = "Demo@2026";
export interface Account {
  actor: Actor;
  email: string;
}
export const accounts: Account[] = actors.map((actor) => ({
  actor,
  email: `${actor.name.toLowerCase().replaceAll(" ", ".")}@nlng.demo`,
}));
export function accountFor(actorId: string): Account | undefined {
  return accounts.find((a) => a.actor.id === actorId);
}
export function authenticate(email: string, password: string): Actor | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password !== demoPassword) return null;
  return accounts.find((a) => a.email === normalized)?.actor ?? null;
}
