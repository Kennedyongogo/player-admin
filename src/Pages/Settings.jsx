import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
  saveAdminSession,
  clearAdminSession,
} from "../api";

const swalTheme = {
  confirmButtonColor: "#8B5CF6",
  background: "#0E0E16",
  color: "#FAFAFA",
};

const LOGOUT_DELAY_MS = 3000;

function normalizePhone(input) {
  const stripped = String(input || "").trim().replace(/[\s-]+/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+")) return stripped;
  if (stripped.startsWith("0")) return `+254${stripped.slice(1)}`;
  if (stripped.startsWith("254")) return `+${stripped}`;
  if (/^\d{9}$/.test(stripped)) return `+254${stripped}`;
  return stripped;
}

function PasswordField({ label, value, onChange, show, onToggle, autoComplete }) {
  return (
    <TextField
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      fullWidth
      autoComplete={autoComplete}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={onToggle}
              edge="end"
              aria-label={show ? "Hide password" : "Show password"}
              sx={{ color: "text.secondary" }}
            >
              {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

export default function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const applyUser = (u) => {
    setNickname(u.nickname || "");
    setPhone(u.phone || "");
    setEmail(u.email || "");
    setRole(u.role || "");
  };

  const logoutAfterPasswordChange = () => {
    clearAdminSession();
    if (setUser) setUser(null);
    navigate("/");
  };

  useEffect(() => {
    if (user) applyUser(user);
    setLoading(true);
    fetchMyProfile()
      .then((res) => {
        const fresh = res.data?.user;
        if (fresh) {
          applyUser(fresh);
          if (setUser) setUser(fresh);
          saveAdminSession({ token: localStorage.getItem("token"), user: fresh });
        }
      })
      .catch(() => {
        if (user) applyUser(user);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError("");

    const normalizedPhone = normalizePhone(phone);
    if (!nickname.trim() || !normalizedPhone) {
      setProfileError("Nickname and phone are required.");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateMyProfile({
        nickname: nickname.trim(),
        phone: normalizedPhone,
        email: email.trim() || null,
      });
      const updated = res.data.user;
      applyUser(updated);
      saveAdminSession({ token: localStorage.getItem("token"), user: updated });
      if (setUser) setUser(updated);
      await Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Your account details have been saved.",
        ...swalTheme,
      });
    } catch (err) {
      const message = err.message || "Failed to update profile";
      setProfileError(message);
      await Swal.fire({ icon: "error", title: "Update failed", text: message, ...swalTheme });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      const seconds = LOGOUT_DELAY_MS / 1000;

      await Swal.fire({
        icon: "success",
        title: "Password changed",
        text: `Your password has been updated. You will be logged out in ${seconds} seconds.`,
        timer: LOGOUT_DELAY_MS,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        ...swalTheme,
      });

      logoutAfterPasswordChange();
    } catch (err) {
      const message = err.message || "Failed to change password";
      setPasswordError(message);
      await Swal.fire({
        icon: "error",
        title: "Password change failed",
        text: message,
        ...swalTheme,
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user && loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#8B5CF6" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Update your account details and password
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#8B5CF6" }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Profile
                </Typography>
                <Chip
                  size="small"
                  label={role}
                  color={role === "superadmin" ? "secondary" : "primary"}
                  sx={{ textTransform: "capitalize", fontWeight: 700 }}
                />
              </Stack>

              <Box component="form" onSubmit={handleProfileSave}>
                <Stack spacing={2}>
                  {profileError && <Alert severity="error">{profileError}</Alert>}
                  <TextField
                    label="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Phone"
                    placeholder="+254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Email (optional)"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <Button type="submit" variant="contained" disabled={profileSaving} sx={{ mt: 1 }}>
                    {profileSaving ? "Saving…" : "Save profile"}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Change password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                After a successful change you will be logged out and must sign in again.
              </Typography>

              <Box component="form" onSubmit={handlePasswordSave}>
                <Stack spacing={2}>
                  {passwordError && <Alert severity="error">{passwordError}</Alert>}
                  <PasswordField
                    label="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    show={showCurrent}
                    onToggle={() => setShowCurrent((v) => !v)}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    label="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    show={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    show={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    autoComplete="new-password"
                  />
                  <Button type="submit" variant="contained" disabled={passwordSaving} sx={{ mt: 1 }}>
                    {passwordSaving ? "Updating…" : "Update password"}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
