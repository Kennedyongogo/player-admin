import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Box, CircularProgress, Card } from "@mui/material";
import Navbar from "./Navbar";
import Settings from "../Pages/Settings";
import NotFound from "../Pages/NotFound";
import TuvibeMap from "../TuvibeMap";
import UsersTable from "./Users/UsersTable";
import Analytics from "./Analytics/Analytics";
import Verification from "./Verification/Verification";
import Marketplace from "./Marketplace/Marketplace";
import Reports from "./Reports/Reports";
import StoriesModeration from "./Stories/StoriesModeration";
import PostsModeration from "./Posts/PostsModeration";
import StoryMusic from "./StoryMusic/StoryMusic";
import FakeContent from "./FakeContent/FakeContent";

function PageRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on component mount
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      // Redirect to login if no user or token
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar user={user} setUser={setUser} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 9 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Routes>
            <Route path="home" element={<Navigate to="/analytics" replace />} />
            <Route path="map" element={<TuvibeMap />} />
            <Route path="verification" element={<Verification />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="stories" element={<StoriesModeration />} />
            <Route path="stories/music" element={<StoryMusic />} />
            <Route path="posts" element={<PostsModeration />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<UsersTable />} />
            <Route path="settings" element={<Settings user={user} />} />
            <Route path="fake-content" element={<FakeContent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}

export default PageRoutes;
