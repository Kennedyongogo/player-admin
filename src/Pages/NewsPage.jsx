import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { createNews, getNews, updateNews } from "../api";
import { colors } from "../theme";

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "announcement",
    isPublished: true,
    isFeatured: false,
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => getNews({ limit: 50 }).then((res) => setItems(res.data?.articles || []));

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const onCreate = async () => {
    try {
      await createNews(form);
      setMsg("Article published");
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
          <Typography variant="h4">News</Typography>
          <Typography color="text.secondary">Announcements for the public portal</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          + New article
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
              <TableCell>Category</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell>{a.isPublished ? "Yes" : "No"}</TableCell>
                <TableCell>{a.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => updateNews(a.id, { isFeatured: !a.isFeatured }).then(load)}
                  >
                    Toggle featured
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New article</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Excerpt" fullWidth value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <TextField
              label="Content"
              fullWidth
              multiline
              minRows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate}>
            Publish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
