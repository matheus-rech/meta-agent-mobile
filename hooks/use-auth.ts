import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

type LogoutState = {
  inProgress: boolean;
  failed: boolean;
  error: Error | null;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [logoutState, setLogoutState] = useState<LogoutState>({
    inProgress: false,
    failed: false,
    error: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper to safely update state only if mounted
  const safeSetState = useCallback(<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  // Clear all auth credentials from storage
  const clearCredentials = useCallback(async () => {
    console.log("[useAuth] Clearing all credentials...");
    try {
      await Promise.all([
        Auth.removeSessionToken(),
        Auth.clearUserInfo(),
      ]);
      console.log("[useAuth] Credentials cleared successfully");
    } catch (err) {
      console.error("[useAuth] Failed to clear credentials:", err);
    }
  }, []);

  // Validate token by calling API (works for both platforms)
  const validateToken = useCallback(async (): Promise<Auth.User | null> => {
    console.log("[useAuth] Validating token with API...");
    try {
      const apiUser = await Api.getMe();
      if (apiUser) {
        const userInfo: Auth.User = {
          id: apiUser.id,
          openId: apiUser.openId,
          name: apiUser.name,
          email: apiUser.email,
          loginMethod: apiUser.loginMethod,
          lastSignedIn: new Date(apiUser.lastSignedIn),
        };
        console.log("[useAuth] Token valid, user:", userInfo);
        return userInfo;
      }
      console.log("[useAuth] Token validation returned no user");
      return null;
    } catch (err) {
      console.error("[useAuth] Token validation failed:", err);
      return null;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      safeSetState(setLoading, true);
      safeSetState(setError, null);

      // Web platform: use cookie-based auth, fetch user from API
      if (Platform.OS === "web") {
        console.log("[useAuth] Web platform: fetching user from API...");
        const apiUser = await Api.getMe();
        console.log("[useAuth] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          safeSetState(setUser, userInfo);
          // Cache user info in localStorage for faster subsequent loads
          await Auth.setUserInfo(userInfo);
          console.log("[useAuth] Web user set from API:", userInfo);
        } else {
          console.log("[useAuth] Web: No authenticated user from API");
          safeSetState(setUser, null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // Native platform: use token-based auth
      console.log("[useAuth] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );

      if (!sessionToken) {
        console.log("[useAuth] No session token, clearing any stale data");
        safeSetState(setUser, null);
        // FIX Bug 3: Clear any stale cached user info when no token
        await Auth.clearUserInfo();
        return;
      }

      // FIX Bug 1 & 2: Always validate token with API, don't just trust cache
      // First, show cached user for faster UX if available
      const cachedUser = await Auth.getUserInfo();
      if (cachedUser) {
        console.log("[useAuth] Showing cached user immediately for UX:", cachedUser);
        safeSetState(setUser, cachedUser);
      }

      // Then validate token in background
      console.log("[useAuth] Validating token with API...");
      const validatedUser = await validateToken();

      if (validatedUser) {
        // Token is valid, update user (may have changed on server)
        safeSetState(setUser, validatedUser);
        await Auth.setUserInfo(validatedUser);
        console.log("[useAuth] Token validated, user updated");
      } else {
        // Token is invalid/expired, clear everything
        console.log("[useAuth] Token invalid, clearing credentials");
        safeSetState(setUser, null);
        await clearCredentials();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      safeSetState(setError, error);
      safeSetState(setUser, null);

      // FIX Bug 3: Clear storage on auth errors to prevent error loops
      console.log("[useAuth] Clearing credentials due to error");
      await clearCredentials();
    } finally {
      safeSetState(setLoading, false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, [safeSetState, validateToken, clearCredentials]);

  const logout = useCallback(async () => {
    setLogoutState({ inProgress: true, failed: false, error: null });

    // FIX Bug 4: Retry logout API call with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    let apiLogoutSuccess = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[useAuth] Logout attempt ${attempt}/${maxRetries}`);
        await Api.logout();
        apiLogoutSuccess = true;
        console.log("[useAuth] Logout API call successful");
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Logout failed");
        console.error(`[useAuth] Logout attempt ${attempt} failed:`, err);

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, attempt - 1) * 500; // 500ms, 1s, 2s
          console.log(`[useAuth] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Always clear local state regardless of API success
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
    setUser(null);
    setError(null);

    if (!apiLogoutSuccess) {
      // FIX Bug 4: Expose logout failure so UI can warn user
      console.error("[useAuth] All logout attempts failed. Cookie may still be valid on web.");
      setLogoutState({
        inProgress: false,
        failed: true,
        error: lastError,
      });
    } else {
      setLogoutState({ inProgress: false, failed: false, error: null });
    }
  }, []);

  // Reset logout failure state (for UI to call after showing warning)
  const clearLogoutError = useCallback(() => {
    setLogoutState({ inProgress: false, failed: false, error: null });
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: fetch user from API directly (user will login manually if needed)
        console.log("[useAuth] Web: fetching user from API...");
        fetchUser();
      } else {
        // FIX Bug 2: For native, always validate even with cached user
        // Show cached user immediately for UX, but validate in background
        Auth.getUserInfo().then((cachedUser) => {
          console.log("[useAuth] Native cached user check:", cachedUser);
          if (cachedUser) {
            console.log("[useAuth] Native: setting cached user immediately for UX");
            setUser(cachedUser);
            // Don't set loading to false yet - let fetchUser complete validation
          }
          // Always run fetchUser to validate token
          fetchUser();
        }).catch((err) => {
          console.error("[useAuth] Failed to get cached user:", err);
          // FIX Bug 3: Clear on error
          clearCredentials().then(() => {
            fetchUser();
          });
        });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser, clearCredentials]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
      logoutState,
    });
  }, [user, loading, isAuthenticated, error, logoutState]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
    // New: Expose logout state for Bug 4 fix
    logoutState,
    clearLogoutError,
  };
}
