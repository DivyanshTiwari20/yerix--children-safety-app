import { createContext, useCallback, useContext, createElement, useReducer, useRef, Dispatch, ReactNode } from "react";

export type EmergencyStatus = "idle" | "countdown" | "active" | "ended";
export type HeardEntry = { text: string; timestamp: number };

export type AppState = {
  status: EmergencyStatus;
  countdownSeconds: number;
  emergencyId: string | null;
  trackUrl: string | null;
  safeModeEnd: number | null;
  armed: boolean;
  armExpiresAt: number | null;
  lastHeard: string;
  heardHistory: HeardEntry[];
};

export type AppAction =
  | { type: "setStatus"; status: EmergencyStatus }
  | { type: "setCountdown"; seconds: number }
  | { type: "setEmergency"; emergencyId: string | null; trackUrl: string | null }
  | { type: "setSafeModeEnd"; end: number | null }
  | { type: "setVoiceArmed"; armed: boolean; expiresAt: number | null }
  | { type: "setLastHeard"; text: string; timestamp: number };

const initialState: AppState = {
  status: "idle",
  countdownSeconds: 0,
  emergencyId: null,
  trackUrl: null,
  safeModeEnd: null,
  armed: false,
  armExpiresAt: null,
  lastHeard: "",
  heardHistory: [],
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
    case "setVoiceArmed":
      return { ...state, armed: action.armed, armExpiresAt: action.expiresAt };
    case "setLastHeard":
      return {
        ...state,
        lastHeard: action.text,
        heardHistory: [...state.heardHistory, { text: action.text, timestamp: action.timestamp }].slice(-5),
      };
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
  if (appDispatch) appDispatch({ type: "setLastHeard", text, timestamp: Date.now() });
}

export function setSafeModeEndStore(end: number | null) {
  if (appDispatch) appDispatch({ type: "setSafeModeEnd", end });
}

export function setVoiceArmedStore(armed: boolean, expiresAt: number | null) {
  if (appDispatch) appDispatch({ type: "setVoiceArmed", armed, expiresAt });
}
