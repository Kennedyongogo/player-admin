import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { createStream, deleteStream, getStreams, updateStream } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const EMPTY_FORM = {
  title: "",
  platform: "twitch",
  channelUrl: "",
  embedUrl: "",
  isLive: false,
  isFeatured: true,
  scheduledAt: "",
};

export default function StreamsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => getStreams().then((res) => setItems(res.data?.streams || []));

  useEffect(() => {
    load().catch((err) => showError("Failed to load streams", err.message));
  }, []);

  const onCreate = async () => {
    if (!form.title.trim() || !form.channelUrl.trim()) {
      showError("Missing fields", "Title and channel URL are required");
      return;
    }
    try {
      await createStream(form);
      showSuccess("Stream added");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateStream(edit.id, {
        title: edit.title,
        platform: edit.platform,
        channelUrl: edit.channelUrl,
        embedUrl: edit.embedUrl,
        scheduledAt: edit.scheduledAt || null,
        isFeatured: edit.isFeatured,
        isLive: edit.isLive,
      });
      showSuccess("Stream updated");
      setEdit(null);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleLive = async (s) => {
    try {
      await updateStream(s.id, { isLive: !s.isLive });
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleFeatured = async (s) => {
    try {
      await updateStream(s.id, { isFeatured: !s.isFeatured });
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onDelete = async (s) => {
    const ok = await showConfirm("Delete stream?", `Permanently delete "${s.title}"?`, "Delete");
    if (!ok) return;
    try {
      await deleteStream(s.id);
      showSuccess("Stream deleted");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Streams</Typography>
          <Typography color="text.secondary">Twitch / YouTube broadcast links</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          + Add stream
        </Button>
      </Stack>
      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Live</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.title}</TableCell>
                <TableCell>{s.platform}</TableCell>
                <TableCell>
                  <Switch size="small" checked={!!s.isLive} onChange={() => toggleLive(s)} />
                </TableCell>
                <TableCell>
                  <Switch size="small" checked={!!s.isFeatured} onChange={() => toggleFeatured(s)} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEdit({ ...s, scheduledAt: s.scheduledAt ? s.scheduledAt.slice(0, 16) : "" })}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(s)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No streams yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add stream</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                <MenuItem value="twitch">Twitch</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Channel URL"
              fullWidth
              value={form.channelUrl}
              onChange={(e) => setForm({ ...form, channelUrl: e.target.value })}
            />
            <TextField
              label="Embed URL"
              fullWidth
              value={form.embedUrl}
              onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
            />
            <TextField
              label="Scheduled at"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit stream</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Title" fullWidth value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select label="Platform" value={edit.platform} onChange={(e) => setEdit({ ...edit, platform: e.target.value })}>
                  <MenuItem value="twitch">Twitch</MenuItem>
                  <MenuItem value="youtube">YouTube</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Channel URL"
                fullWidth
                value={edit.channelUrl || ""}
                onChange={(e) => setEdit({ ...edit, channelUrl: e.target.value })}
              />
              <TextField
                label="Embed URL"
                fullWidth
                value={edit.embedUrl || ""}
                onChange={(e) => setEdit({ ...edit, embedUrl: e.target.value })}
              />
              <TextField
                label="Scheduled at"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={edit.scheduledAt || ""}
                onChange={(e) => setEdit({ ...edit, scheduledAt: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
