import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getProfile,
  getStoredUser,
  saveProfile as saveProfileRequest,
  signInWithGoogle as signInWithGoogleRequest,
  signOut as signOutRequest,
  type AuthUser,
  type UserProfile,
} from "@/services/auth";

type AuthContextValue = {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  saveProfile: (profile: Pick<UserProfile, "full_name" | "phone">) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const storedUser = await getStoredUser();
    setUser(storedUser);
    setProfile(storedUser ? await getProfile() : null);
  }, []);

  useEffect(() => {
    loadProfile()
      .catch((cause) => setError(String((cause as Error).message ?? cause)))
      .finally(() => setLoading(false));
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const signedInUser = await signInWithGoogleRequest();
    if (!signedInUser) return;
    setUser(signedInUser);
    setProfile(await getProfile());
  }, []);

  const saveProfile = useCallback(async (values: Pick<UserProfile, "full_name" | "phone">) => {
    const savedProfile = await saveProfileRequest(values);
    setProfile(savedProfile);
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    setProfile(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, error, signInWithGoogle, saveProfile, signOut }),
    [user, profile, loading, error, signInWithGoogle, saveProfile, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
