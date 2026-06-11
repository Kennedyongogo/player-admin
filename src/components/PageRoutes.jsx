import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard/Dashboard";
import Users from "./Users/Users";
import Matches from "./Matches/Matches";
import Questions from "./Questions/Questions";
import Settings from "../Pages/Settings";
import Finance from "./Finance/Finance";
import NotFound from "../Pages/NotFound";

export default function PageRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  }, []);

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden", width: "100%" }}>
      <Navbar user={user} setUser={setUser} />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          pt: 8,
          px: { xs: 2, md: 3 },
          pb: 4,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#8B5CF6" }} />
          </Box>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/users" element={<Users />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<Settings user={user} setUser={setUser} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}
