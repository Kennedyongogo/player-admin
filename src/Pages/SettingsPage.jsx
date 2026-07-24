import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { broadcastNotification, getMeta } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { useEffect } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMeta().then((res) => setMeta(res.data));
  }, []);

  const send = async () => {
    try {
      const res = await broadcastNotification({ title, message });
      setMsg(res.message || "Broadcast sent");
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Platform configuration & announcements
      </Typography>
      {msg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg("")}>
          {msg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Signed in as
        </Typography>
        <Typography>
          {user?.username} · {user?.email} · {user?.role}
        </Typography>
      </Box>

      <Box sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Broadcast notification
        </Typography>
        <Stack spacing={2}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Button variant="contained" onClick={send}>
            Send to all players
          </Button>
        </Stack>
      </Box>

      {meta && (
        <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Platform meta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Regions: {meta.regions?.join(", ")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Roles: {meta.userRoles?.join(", ")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
