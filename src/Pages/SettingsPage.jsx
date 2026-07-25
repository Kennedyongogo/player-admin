import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { broadcastNotification, getConfig, getMeta, upsertConfig } from "../api";
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
  const { user, isSuperAdmin } = useAuth();
  const [meta, setMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userIdsText, setUserIdsText] = useState("");
  const [configs, setConfigs] = useState([]);
  const [configKey, setConfigKey] = useState("");
  const [configValue, setConfigValue] = useState("");

  useEffect(() => {
    getMeta().then((res) => setMeta(res.data));
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getConfig()
      .then((res) => setConfigs(res.data?.configs || []))
      .catch((err) => showError("Failed to load config", err.message));
  }, [isSuperAdmin]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      showError("Missing fields", "Title and message are required");
      return;
    }
    const userIds = userIdsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await broadcastNotification({
        title,
        message,
        ...(userIds.length ? { userIds } : {}),
      });
      showSuccess(userIds.length ? "Targeted notification sent" : "Broadcast sent", res.message);
      setTitle("");
      setMessage("");
      setUserIdsText("");
    } catch (err) {
      showError("Send failed", err.message);
    }
  };

  const saveConfig = async () => {
    if (!configKey.trim()) {
      showError("Key required", "Enter a config key");
      return;
    }
    try {
      let value = configValue;
      try {
        value = JSON.parse(configValue);
      } catch {
        // keep as raw string if not valid JSON
      }
      await upsertConfig(configKey.trim(), value);
      showSuccess("Config saved");
      setConfigKey("");
      setConfigValue("");
      const res = await getConfig();
      setConfigs(res.data?.configs || []);
    } catch (err) {
      showError("Save failed", err.message);
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
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Leave user IDs blank to broadcast to all players, or list specific user IDs to target them
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
            <TextField
              label="Target user IDs (optional, one per line or comma-separated)"
              value={userIdsText}
              onChange={(e) => setUserIdsText(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Button variant="contained" onClick={send} fullWidth>
              {userIdsText.trim() ? "Send to selected users" : "Send to all players"}
            </Button>
          </Stack>
        </Box>

        {isSuperAdmin && (
          <Box sx={panelSx}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Platform configuration
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField label="Key" value={configKey} onChange={(e) => setConfigKey(e.target.value)} sx={{ minWidth: 200 }} />
              <TextField
                label="Value (JSON or text)"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={saveConfig}>
                Save
              </Button>
            </Stack>
            {configs.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configs.map((c) => (
                    <TableRow key={c.key}>
                      <TableCell>{c.key}</TableCell>
                      <TableCell sx={{ wordBreak: "break-all" }}>
                        {typeof c.value === "string" ? c.value : JSON.stringify(c.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

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

