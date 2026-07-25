import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getMe, getStoredUser, saveSession } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [booting, setBooting] = useState(!!localStorage.getItem("apac_south_admin_token"));

  useEffect(() => {
    const token = localStorage.getItem("apac_south_admin_token");
    if (!token) {
      setBooting(false);
      return;
    }
    getMe()
      .then((res) => {
        const u = res.data.user;
        if (!["superadmin", "tournament_admin", "host"].includes(u.role)) {
          clearSession();
          setUser(null);
          return;
        }
        setUser(u);
        saveSession({ token, user: u });
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const loginUser = useCallback(({ token, user: next }) => {
    saveSession({ token, user: next });
    setUser(next);
  }, []);

  const logoutUser = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      loginUser,
      logoutUser,
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === "superadmin",
      isTournamentAdmin: user?.role === "tournament_admin",
      isHost: user?.role === "host",
      isStaff: ["superadmin", "tournament_admin"].includes(user?.role),
    }),
    [user, booting, loginUser, logoutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
