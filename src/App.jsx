import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { theme, colors } from "./theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./Pages/LoginPage";
import DashboardPage from "./Pages/DashboardPage";
import TournamentsPage from "./Pages/TournamentsPage";
import RegistrationsPage from "./Pages/RegistrationsPage";
import LobbiesPage from "./Pages/LobbiesPage";
import ScoresPage from "./Pages/ScoresPage";
import LeaderboardsPage from "./Pages/LeaderboardsPage";
import TeamsPage from "./Pages/TeamsPage";
import UsersPage from "./Pages/UsersPage";
import SponsorsPage from "./Pages/SponsorsPage";
import NewsPage from "./Pages/NewsPage";
import StreamsPage from "./Pages/StreamsPage";
import ReportsPage from "./Pages/ReportsPage";
import SettingsPage from "./Pages/SettingsPage";

function Boot() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: colors.bg }}>
      <CircularProgress sx={{ color: colors.primary }} />
    </Box>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <Boot />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { booting } = useAuth();
  if (booting) return <Boot />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/registrations" element={<RegistrationsPage />} />
        <Route path="/lobbies" element={<LobbiesPage />} />
        <Route path="/scores" element={<ScoresPage />} />
        <Route path="/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
