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
  People,
  TrendingUp,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { adminLogin, saveAdminSession } from "../api";

const swalTheme = {
  confirmButtonColor: "#8B5CF6",
  background: "#0E0E16",
  color: "#FAFAFA",
};

const ADMIN_TOOLS = [
  {
    icon: Quiz,
    text: "Question bank",
    sub: "Create & curate the quiz pool",
    accent: "#A78BFA",
  },
  {
    icon: SportsEsports,
    text: "Live matches",
    sub: "Queues, lobbies & active games",
    accent: "#10F0A0",
  },
  {
    icon: AccountBalanceWallet,
    text: "Wallet & M-Pesa",
    sub: "Deposits, withdrawals & prizes",
    accent: "#F5C518",
  },
  {
    icon: MonitorHeart,
    text: "System health",
    sub: "Players, pools & performance",
    accent: "#60A5FA",
  },
];

const TICKER_ITEMS = [
  "🛡 Secure admin session",
  "📊 Dashboard analytics ready",
  "⚡ Live match monitoring",
  "💜 ChapaQuiz Control Center",
  "✓ Superadmin tools enabled",
];

const STAT_PILLS = [
  { icon: People, label: "User management", value: "Players & staff" },
  { icon: TrendingUp, label: "Real-time ops", value: "Live refresh" },
  { icon: Shield, label: "Access control", value: "Role-based" },
];

function normalizePhone(input) {
  const stripped = String(input || "").trim().replace(/[\s-]+/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+")) return stripped;
  if (stripped.startsWith("0")) return `+254${stripped.slice(1)}`;
  if (stripped.startsWith("254")) return `+${stripped}`;
  if (/^\d{9}$/.test(stripped)) return `+254${stripped}`;
  return stripped;
}

function AdminTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <Box
      sx={{
        width: "100%",
        overflow: "hidden",
        py: 1.1,
        borderBottom: "1px solid rgba(139,92,246,0.15)",
        bgcolor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ display: "flex", width: "max-content", animation: "ticker 32s linear infinite" }}>
        {items.map((item, i) => (
          <Typography
            key={i}
            component="span"
            sx={{
              px: 3,
              fontSize: { xs: "0.72rem", sm: "0.8rem" },
              fontWeight: 600,
              color: "rgba(167,139,250,0.85)",
              whiteSpace: "nowrap",
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function AuroraOrbs() {
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          width: { xs: 280, md: 420 },
          height: { xs: 280, md: 420 },
          borderRadius: "50%",
          top: "-8%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "aurora-drift 14s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: { xs: 240, md: 360 },
          height: { xs: 240, md: 360 },
          borderRadius: "50%",
          bottom: "5%",
          right: "-3%",
          background: "radial-gradient(circle, rgba(245,197,24,0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "aurora-drift 18s ease-in-out infinite reverse",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          top: "40%",
          right: "30%",
          background: "radial-gradient(circle, rgba(16,240,160,0.12) 0%, transparent 70%)",
          filter: "blur(35px)",
          animation: "pulse-glow 6s ease-in-out infinite",
        }}
      />
    </>
  );
}

function AdminBackground() {
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 55% at 12% 18%, rgba(139,92,246,0.28) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 92% 78%, rgba(245,197,24,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 55% 50%, rgba(99,102,241,0.1) 0%, transparent 45%),
            linear-gradient(165deg, #030306 0%, #0a0812 42%, #050508 100%)
          `,
        }}
      />
      <AuroraOrbs />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)
          `,
          backgroundSize: { xs: "36px 36px", md: "52px 52px" },
          maskImage: "radial-gradient(ellipse 95% 85% at 50% 45%, black 10%, transparent 80%)",
        }}
      />
    </Box>
  );
}

function ToolBentoGrid({ compact }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr 1fr" : { xs: "1fr 1fr", lg: "1fr 1fr" },
        gap: { xs: 1, sm: 1.25 },
        mt: { xs: 2, md: 2.5 },
      }}
    >
      {ADMIN_TOOLS.map(({ icon: Icon, text, sub, accent }, i) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.07, duration: 0.45 }}
        >
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.5 },
              borderRadius: "16px",
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
              transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              height: "100%",
              "&:hover": {
                transform: "translateY(-3px)",
                borderColor: `${accent}44`,
                boxShadow: `0 12px 32px ${accent}22`,
              },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: `${accent}18`,
                border: `1px solid ${accent}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accent,
                mb: 1,
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3 }}>{text}</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.25, lineHeight: 1.4 }}>
              {sub}
            </Typography>
          </Box>
        </motion.div>
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

      await Swal.fire({
        icon: "success",
        title: "Welcome back",
        text: `Signed in as ${user.nickname || user.role}`,
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        ...swalTheme,
      });

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
      <AdminTicker />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2.5, md: 3 },
          flex: 1,
          minHeight: 0,
          overflow: { xs: "auto", md: "hidden" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          gap: { xs: 3, md: 4, lg: 6 },
          alignItems: "center",
        }}
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent={{ xs: "center", md: "flex-start" }}
              sx={{ mb: 2.5 }}
            >
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: "22px",
                    border: "1px dashed rgba(167,139,250,0.25)",
                    animation: "ring-spin 24s linear infinite",
                  }}
                />
                <Box sx={logoSx}>
                  <AdminPanelSettings sx={{ fontSize: { xs: 28, md: 32 }, color: "#050508" }} />
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: "20px",
                  bgcolor: "rgba(139,92,246,0.18)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  boxShadow: "0 0 24px rgba(139,92,246,0.2)",
                }}
              >
                <Shield sx={{ fontSize: 15, color: "#C4B5FD" }} />
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#C4B5FD", letterSpacing: "0.1em" }}>
                  ADMIN ONLY
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: {
                  xs: "2.1rem",
                  sm: "2.65rem",
                  md: isShort ? "2.35rem" : "2.85rem",
                  lg: isShort ? "2.6rem" : "3.2rem",
                },
                lineHeight: 1.05,
                letterSpacing: "-0.045em",
                mb: 1.25,
              }}
            >
              Run{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 35%, #F5C518 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "gradient-shift 6s ease infinite",
                }}
              >
                ChapaQuiz
              </Box>
              <Box
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.42em",
                  color: "text.secondary",
                  mt: 0.75,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                Control Center · Operations Dashboard
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.92rem", md: "1.02rem" },
                lineHeight: 1.7,
                maxWidth: 480,
                mx: { xs: "auto", md: 0 },
                mb: { xs: 2, md: 2.5 },
              }}
            >
              Your command hub for questions, live matches, wallets, and player management — designed for
              fast, confident operations.
            </Typography>

            <Stack
              direction="row"
              flexWrap="wrap"
              gap={1}
              justifyContent={{ xs: "center", md: "flex-start" }}
              sx={{ mb: { xs: 0, md: 0.5 } }}
            >
              {STAT_PILLS.map(({ icon: Icon, label, value }) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.85,
                    borderRadius: "14px",
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon sx={{ fontSize: 16, color: "#A78BFA" }} />
                  <Box>
                    <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, lineHeight: 1 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>{value}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <ToolBentoGrid compact={isShort} />
            </Box>
          </Box>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%" }}
        >
          <Box sx={{ position: "relative", maxWidth: 440, mx: "auto" }}>
            <Box
              sx={{
                position: "absolute",
                inset: "-20%",
                background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)",
                filter: "blur(30px)",
                pointerEvents: "none",
                animation: "pulse-glow 5s ease-in-out infinite",
              }}
            />
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
                  background:
                    "linear-gradient(145deg, rgba(167,139,250,0.65), rgba(255,255,255,0.06), rgba(245,197,24,0.35))",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
                <VerifiedUser sx={{ color: "#A78BFA", fontSize: 24 }} />
                <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.25rem", sm: "1.4rem" } }}>
                  Admin sign in
                </Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ fontSize: "0.84rem", textAlign: "center", mb: 2.5 }}>
                Authorized personnel only — no public registration
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0.25, borderRadius: "12px" }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: "#A78BFA", fontSize: 18 }} />
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "#A78BFA", fontSize: 18 }} />
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
                    py: { xs: 1.35, md: 1.3 },
                    color: "#fff !important",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    borderRadius: "14px",
                    textTransform: "none",
                    letterSpacing: "0.02em",
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
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(245,197,24,0.05) 100%)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Shield sx={{ fontSize: 17, color: "#A78BFA", mt: 0.1, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "0.73rem" }}>
                  Secured session. Admin accounts are created by superadmin only. Player accounts cannot access
                  this portal.
                </Typography>
              </Box>
            </Box>
          </Box>

          {isMobile && <ToolBentoGrid compact />}
        </motion.div>
      </Box>

      <Typography
        variant="caption"
        sx={{
          position: "relative",
          zIndex: 1,
          color: "text.secondary",
          opacity: 0.55,
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
  position: "relative",
  overflow: "hidden",
  bgcolor: "#050508",
};

const cardSx = {
  bgcolor: "rgba(10,10,18,0.82)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: { xs: "22px", sm: "26px" },
  p: { xs: 2.75, sm: 3.25 },
  boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const logoSx = {
  width: { xs: 54, md: 60 },
  height: { xs: 54, md: 60 },
  borderRadius: "18px",
  background: "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 45%, #F5C518 100%)",
  backgroundSize: "200% 200%",
  animation: "gradient-shift 5s ease infinite",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 12px 40px rgba(139,92,246,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset",
  flexShrink: 0,
};
