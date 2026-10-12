"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Actor, Scenario, State, actors } from "@/lib/domain/model";
import { Action, parseState, seed, transition } from "@/lib/domain/workflow";
interface ContextValue {
  state: State;
  actor: Actor;
  ready: boolean;
  storageWarning: boolean;
  setActor: (id: string) => void;
  act: (action: Action) => boolean;
  reset: (scenario: Scenario) => void;
  notify: (message: string) => void;
  exportData: () => void;
}
const Context = createContext<ContextValue | null>(null);
const key = "nlng-payroll-v1";
export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(() => seed("Clean baseline"));
  const current = useRef(state);
  const [actorId, setActorId] = useState(actors[0].id);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [message, setMessage] = useState("");
  const actor = actors.find((a) => a.id === actorId) ?? actors[0];
  useEffect(() => {
    try {
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
  const reset = (scenario: Scenario) => {
    const next = seed(scenario);
    current.current = next;
    setState(next);
    setActorId(actors[0].id);
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
        setActor: setActorId,
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
            ×
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
