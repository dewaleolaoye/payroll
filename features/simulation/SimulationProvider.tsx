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
import { Actor, Scenario, State, actors } from "@/lib/domain/model";
import { Action, parseState, seed, transition } from "@/lib/domain/workflow";
import { authenticate } from "@/lib/auth/accounts";
interface Session {
  actorId: string;
  signedInAt: string;
}
interface ContextValue {
  state: State;
  actor: Actor;
  ready: boolean;
  storageWarning: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  act: (action: Action) => boolean;
  reset: (scenario: Scenario) => void;
  notify: (message: string) => void;
  exportData: () => void;
}
const Context = createContext<ContextValue | null>(null);
const key = "nlng-payroll-v1";
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
export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(() => seed("Clean baseline"));
  const current = useRef(state);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [message, setMessage] = useState("");
  const actor = actors.find((a) => a.id === session?.actorId) ?? actors[0];
  useEffect(() => {
    try {
      setSession(parseSession(localStorage.getItem(sessionKey)));
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = parseState(raw);
        if (saved) {
          current.current = saved;
          setState(saved);
        } else
          setMessage(
            "Saved demo data could not be loaded. A clean baseline was restored.",
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
        const next = transition(current.current, action, actor);
        current.current = next;
        setState(next);
        setMessage(
          action.type === "processPayroll"
            ? "Payroll processed. All payments are simulated."
            : "Changes saved to the source records.",
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
    setMessage("Signed out. Demo data is kept for the next persona.");
  };
  const reset = (scenario: Scenario) => {
    const next = seed(scenario);
    current.current = next;
    setState(next);
    setMessage(
      `${scenario} loaded. Simulation restored to its starting state.`,
    );
  };
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schema: "nlng.payroll.source.v1",
            exportedAt: new Date().toISOString(),
            ...current.current,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nlng-payroll-${current.current.scenario.toLowerCase().replaceAll(" ", "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Source data exported. External ingestion is not connected.");
  };
  return (
    <Context.Provider
      value={{
        state,
        actor,
        ready,
        storageWarning,
        signedIn: session !== null,
        signIn,
        signOut,
        act,
        reset,
        notify: setMessage,
        exportData,
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
export function useSimulation(): ContextValue {
  const context = useContext(Context);
  if (!context) throw new Error("Simulation provider required");
  return context;
}
