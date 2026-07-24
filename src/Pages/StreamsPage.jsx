import { useEffect, useState } from "react";
import {
  Alert,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { createStream, getStreams, updateStream } from "../api";
import { colors } from "../theme";

export default function StreamsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    platform: "twitch",
    channelUrl: "",
    isLive: false,
    isFeatured: true,
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => getStreams().then((res) => setItems(res.data?.streams || []));

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const onCreate = async () => {
    try {
      await createStream(form);
      setMsg("Stream added");
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
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
                <TableCell>{s.isLive ? "Yes" : "No"}</TableCell>
                <TableCell>{s.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => updateStream(s.id, { isLive: !s.isLive }).then(load)}>
                    Toggle live
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
