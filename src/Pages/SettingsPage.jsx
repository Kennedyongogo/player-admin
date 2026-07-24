import { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { broadcastNotification, getMeta } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { showError, showSuccess } from "../utils/swal";

const panelSx = {
  px: { xs: 2, md: 3 },
  py: 3,
  width: "100%",
  borderTop: `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
  bgcolor: colors.surface,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMeta().then((res) => setMeta(res.data));
  }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      showError("Missing fields", "Title and message are required");
      return;
    }
    try {
      const res = await broadcastNotification({ title, message });
      showSuccess("Broadcast sent", res.message);
      setTitle("");
      setMessage("");
    } catch (err) {
      showError("Broadcast failed", err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Platform configuration & announcements
      </Typography>

      <Stack spacing={2} sx={{ mx: { xs: -2, md: -3 }, mb: 1 }}>
        <Box sx={panelSx}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Signed in as
          </Typography>
          <Typography>
            {user?.username} · {user?.email} · {user?.role}
          </Typography>
        </Box>

        <Box sx={panelSx}>
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
            <Button variant="contained" onClick={send} fullWidth>
              Send to all players
            </Button>
          </Stack>
        </Box>

        {meta && (
          <Box sx={panelSx}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Platform meta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Regions: {meta.regions?.join(", ")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Roles: {Array.isArray(meta.userRoles) ? meta.userRoles.join(", ") : Object.values(meta.userRoles || {}).join(", ")}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
