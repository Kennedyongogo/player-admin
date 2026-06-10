import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Phone,
  Lock,
  AdminPanelSettings,
  Shield,
  Quiz,
  SportsEsports,
  AccountBalanceWallet,
  MonitorHeart,
  VerifiedUser,
} from "@mui/icons-material";
import { adminLogin, saveAdminSession } from "../api";

const ADMIN_TOOLS = [
  { icon: Quiz, text: "Question bank", sub: "Add, edit & deactivate MCQs" },
  { icon: SportsEsports, text: "Live matches", sub: "Monitor queues & active games" },
  { icon: AccountBalanceWallet, text: "Wallet & M-Pesa", sub: "Deposits, withdrawals, payouts" },
  { icon: MonitorHeart, text: "System health", sub: "Players, pools & performance" },
];

const FLOATING_ICONS = ["⚙", "📊", "🛡", "✓", "Q", "₿"];

function normalizePhone(input) {
  const stripped = String(input || "").trim().replace(/[\s-]+/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+")) return stripped;
  if (stripped.startsWith("0")) return `+254${stripped.slice(1)}`;
  if (stripped.startsWith("254")) return `+${stripped}`;
  if (/^\d{9}$/.test(stripped)) return `+254${stripped}`;
  return stripped;
}

function AdminBackground() {
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 75% 55% at 15% 15%, rgba(139,92,246,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 65% 45% at 90% 75%, rgba(245,197,24,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 45% 35% at 55% 45%, rgba(99,102,241,0.12) 0%, transparent 45%),
            linear-gradient(165deg, #050508 0%, #0c0a14 45%, #050508 100%)
          `,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.3,
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: { xs: "32px 32px", md: "48px 48px" },
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 45%, black 15%, transparent 78%)",
        }}
      />
      {FLOATING_ICONS.map((label, i) => (
        <Box
          key={label}
          sx={{
            position: "absolute",
            width: { xs: 34, md: 48 },
            height: { xs: 34, md: 48 },
            borderRadius: "12px",
            display: { xs: i > 3 ? "none" : "flex", sm: "flex" },
            alignItems: "center",
            justifyContent: "center",
            fontSize: { xs: "0.9rem", md: "1.1rem" },
            color: "rgba(167,139,250,0.2)",
            border: "1px solid rgba(139,92,246,0.12)",
            bgcolor: "rgba(139,92,246,0.04)",
            top: `${10 + (i * 15) % 58}%`,
            left: `${8 + (i * 19) % 82}%`,
            animation: `${i % 2 === 0 ? "float" : "float-reverse"} ${4.5 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.35}s`,
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
}

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isShort = useMediaQuery("(max-height: 820px)");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalized = normalizePhone(phone);
    if (!normalized || !password) {
      setError("Enter your admin phone number and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await adminLogin({ phone: normalized, password });
      saveAdminSession({ token, user });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={pageSx}>
      <AdminBackground />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: { xs: 480, sm: 520, md: 1100, lg: 1200 },
          mx: "auto",
          px: { xs: 2, sm: 3, md: 3, lg: 4 },
          py: { xs: 2, sm: 2.5, md: 2 },
          flex: 1,
          minHeight: 0,
          maxHeight: "100dvh",
          overflow: { xs: "auto", md: "hidden" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 3, md: 4, lg: 7 },
          alignItems: "center",
        }}
      >
        {/* Brand panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent={{ xs: "center", md: "flex-start" }}
              sx={{ mb: 2 }}
            >
              <Box sx={logoSx}>
                <AdminPanelSettings sx={{ fontSize: { xs: 26, md: 30 }, color: "#050508" }} />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  bgcolor: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.35)",
                }}
              >
                <Shield sx={{ fontSize: 14, color: "#A78BFA" }} />
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#A78BFA", letterSpacing: "0.06em" }}>
                  ADMIN ONLY
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: {
                  xs: "1.85rem",
                  sm: "2.35rem",
                  md: isShort ? "2rem" : "2.5rem",
                  lg: isShort ? "2.25rem" : "2.85rem",
                },
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                mb: 1,
              }}
            >
              Chapa
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #A78BFA 0%, #F5C518 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Quiz
              </Box>
              <Box component="span" sx={{ display: "block", fontSize: "0.55em", color: "text.secondary", mt: 0.5, fontWeight: 600 }}>
                Control Center
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.9rem", md: "1rem" },
                lineHeight: 1.65,
                maxWidth: 420,
                mx: { xs: "auto", md: 0 },
                mb: { xs: 2, md: isShort ? 1.5 : 2.5 },
              }}
            >
              Manage questions, oversee live matches, and process M-Pesa withdrawals — everything needed to run ChapaQuiz.
            </Typography>

            <Stack
              spacing={1.25}
              sx={{ display: { xs: "none", sm: isShort && !isMobile ? "none" : "flex" } }}
            >
              {ADMIN_TOOLS.map(({ icon: Icon, text, sub }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, justifyContent: { xs: "center", md: "flex-start" } }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(245,197,24,0.08) 100%)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#A78BFA",
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{text}</Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{sub}</Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>

            {/* Mobile tool pills */}
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.75}
              justifyContent="center"
              sx={{ display: { xs: "flex", sm: "none" } }}
            >
              {ADMIN_TOOLS.map(({ icon: Icon, text }) => (
                <Box
                  key={text}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.25,
                    py: 0.6,
                    borderRadius: "18px",
                    bgcolor: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <Icon sx={{ fontSize: 13, color: "#A78BFA" }} />
                  {text}
                </Box>
              ))}
            </Stack>
          </Box>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%" }}
        >
          <Box
            sx={{
              ...cardSx,
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                padding: "1px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(255,255,255,0.05), rgba(245,197,24,0.25))",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
              <VerifiedUser sx={{ color: "#A78BFA", fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                Admin sign in
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", mb: 2.5 }}>
              Authorized personnel only — no public registration
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 1.5, py: 0.25 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Admin phone"
                placeholder="+254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                helperText=" "
                FormHelperTextProps={{ sx: { minHeight: "1.25em" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                helperText=" "
                FormHelperTextProps={{ sx: { minHeight: "1.25em" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label="toggle password"
                        sx={{ color: "text.secondary" }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="admin-shimmer-btn"
                sx={{
                  mt: 2,
                  py: { xs: 1.3, md: 1.25 },
                  color: "#fff !important",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  borderRadius: "14px",
                  "&:disabled": {
                    background: "rgba(139,92,246,0.35) !important",
                    animation: "none",
                    color: "rgba(255,255,255,0.45) !important",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Access dashboard →"
                )}
              </Button>
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: "12px",
                bgcolor: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Shield sx={{ fontSize: 16, color: "#A78BFA", mt: 0.15, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: "0.72rem" }}>
                Secured session. Admin accounts are created by superadmin only. Player accounts cannot access this portal.
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>

      <Typography
        variant="caption"
        sx={{
          position: "relative",
          zIndex: 1,
          color: "text.secondary",
          opacity: 0.6,
          pb: { xs: 2, md: 1.5 },
          fontSize: "0.68rem",
        }}
      >
        ChapaQuiz Admin © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

const pageSx = {
  height: "100dvh",
  maxHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  bgcolor: "#050508",
};

const cardSx = {
  bgcolor: "rgba(12,12,20,0.8)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: { xs: "20px", sm: "24px" },
  p: { xs: 2.5, sm: 3, md: 2.75, lg: 3.25 },
  boxShadow: "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
  maxWidth: 440,
  mx: "auto",
};

const logoSx = {
  width: { xs: 50, md: 56 },
  height: { xs: 50, md: 56 },
  borderRadius: "16px",
  background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #F5C518 100%)",
  backgroundSize: "200% 200%",
  animation: "gradient-shift 5s ease infinite",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 32px rgba(139,92,246,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset",
  flexShrink: 0,
};
