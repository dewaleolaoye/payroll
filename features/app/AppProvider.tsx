"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { XIcon } from "@phosphor-icons/react";
import { Actor, State, actors, today as currentDate } from "@/lib/domain/model";
import { Action, parseState, seed, transition } from "@/lib/domain/workflow";
import { authenticate } from "@/lib/auth/accounts";
interface Session {
  actorId: string;
  signedInAt: string;
}
interface ContextValue {
  state: State;
  actor: Actor;
  /** Today's date, "YYYY-MM-DD". */
  today: string;
  ready: boolean;
  storageWarning: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  act: (action: Action) => boolean;
  notify: (message: string) => void;
}
const Context = createContext<ContextValue | null>(null);
const key = "nlng-payroll-v3";
const legacyKeys = ["nlng-payroll-v1", "nlng-payroll-v2"];
const sessionKey = "nlng-payroll-session";
function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    return typeof value.actorId === "string" &&
      typeof value.signedInAt === "string" &&
      actors.some((a) => a.id === value.actorId)
      ? { actorId: value.actorId, signedInAt: value.signedInAt }
      : null;
  } catch {
    return null;
  }
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const today = currentDate();
  const [state, setState] = useState<State>(() => seed(today));
  const current = useRef(state);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [message, setMessage] = useState("");
  const actor = actors.find((a) => a.id === session?.actorId) ?? actors[0];
  useEffect(() => {
    try {
      setSession(parseSession(localStorage.getItem(sessionKey)));
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = parseState(raw);
        if (saved) {
          current.current = saved;
          setState(saved);
        } else
          setMessage(
            "Saved records could not be loaded. Starting records were restored.",
          );
      }
    } catch {
      setStorageWarning(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
        setStorageWarning(false);
      } catch {
        setStorageWarning(true);
      }
    }
  }, [state, ready]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  const act = useCallback(
    (action: Action): boolean => {
      try {
        const next = transition(current.current, action, actor, currentDate());
        current.current = next;
        setState(next);
        setMessage(
          action.type === "processPayroll"
            ? "Payroll processed."
            : action.type === "closePeriod"
              ? "Payroll period closed. The next period is open."
              : action.type === "exit"
                ? "Exit recorded — awaiting approval."
                : action.type === "approveExit"
                  ? "Exit approved."
                  : action.type === "returnExit"
                    ? "Exit returned."
                    : "Changes saved.",
        );
        return true;
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to complete action.",
        );
        return false;
      }
    },
    [actor],
  );
  const saveSession = (next: Session | null) => {
    setSession(next);
    try {
      if (next) localStorage.setItem(sessionKey, JSON.stringify(next));
      else localStorage.removeItem(sessionKey);
    } catch {
      setStorageWarning(true);
    }
  };
  const signIn = (email: string, password: string): boolean => {
    const match = authenticate(email, password);
    if (!match) return false;
    saveSession({ actorId: match.id, signedInAt: new Date().toISOString() });
    setMessage(`Signed in as ${match.name} · ${match.role}.`);
    return true;
  };
  const signOut = () => {
    saveSession(null);
    setMessage("Signed out.");
  };
  return (
    <Context.Provider
      value={{
        state,
        actor,
        today,
        ready,
        storageWarning,
        signedIn: session !== null,
        signIn,
        signOut,
        act,
        notify: setMessage,
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp(): ContextValue {
  const context = useContext(Context);
  if (!context) throw new Error("App provider required");
  return context;
}
