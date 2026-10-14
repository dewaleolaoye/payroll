import { Actor, actors } from "../domain/model";
// Staff accounts live in code until a user database is integrated.
export const defaultPassword = "Payroll@2026";
export interface Account {
  actor: Actor;
  email: string;
}
export const accounts: Account[] = actors.map((actor) => ({
  actor,
  email: `${actor.name.toLowerCase().replaceAll(" ", ".")}@nlng.local`,
}));
export function accountFor(actorId: string): Account | undefined {
  return accounts.find((a) => a.actor.id === actorId);
}
export function authenticate(email: string, password: string): Actor | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password !== defaultPassword) return null;
  return accounts.find((a) => a.email === normalized)?.actor ?? null;
}
