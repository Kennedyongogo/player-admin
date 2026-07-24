import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import PasswordField from "../components/PasswordField";
import { showError, showSuccess } from "../utils/swal";

export default function LoginPage() {
  const { loginUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin({ email, password });
      await showSuccess("Welcome back", `Signed in as ${res.data.user?.username || email}`);
      loginUser({ token: res.data.token, user: res.data.user });
      navigate("/dashboard");
    } catch (err) {
      await showError("Login failed", err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.28), transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(0,194,255,0.12), transparent 45%)
        `,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderColor: "rgba(124,58,237,0.4)" }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <BrandLogo variant="full" height={72} link={false} sx={{ mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 1 }}>
              Admin login
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Tournament operations, lobbies, and platform control.
            </Typography>
            <Stack component="form" spacing={2} onSubmit={onSubmit}>
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PasswordField
                label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
