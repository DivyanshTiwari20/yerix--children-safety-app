import { createContext, useCallback, useContext, createElement, useReducer, useRef, Dispatch, ReactNode } from "react";

export type EmergencyStatus = "idle" | "countdown" | "active" | "ended";

export type AppState = {
  status: EmergencyStatus;
  countdownSeconds: number;
  emergencyId: string | null;
  trackUrl: string | null;
  safeModeEnd: number | null;
  lastHeard: string;
};

export type AppAction =
  | { type: "setStatus"; status: EmergencyStatus }
  | { type: "setCountdown"; seconds: number }
  | { type: "setEmergency"; emergencyId: string | null; trackUrl: string | null }
  | { type: "setSafeModeEnd"; end: number | null }
  | { type: "setLastHeard"; text: string };

const initialState: AppState = {
  status: "idle",
  countdownSeconds: 0,
  emergencyId: null,
  trackUrl: null,
  safeModeEnd: null,
  lastHeard: "",
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setStatus":
      return { ...state, status: action.status };
    case "setCountdown":
      return { ...state, countdownSeconds: action.seconds };
    case "setEmergency":
      return { ...state, emergencyId: action.emergencyId, trackUrl: action.trackUrl };
    case "setSafeModeEnd":
      return { ...state, safeModeEnd: action.end };
    case "setLastHeard":
      return { ...state, lastHeard: action.text };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null);

let appDispatch: Dispatch<AppAction> | null = null;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  appDispatch = dispatch;
  return createElement(AppContext.Provider, { value: { state, dispatch } }, children);
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function setLastHeard(text: string) {
  if (appDispatch) appDispatch({ type: "setLastHeard", text });
}

export function setSafeModeEndStore(end: number | null) {
  if (appDispatch) appDispatch({ type: "setSafeModeEnd", end });
}
