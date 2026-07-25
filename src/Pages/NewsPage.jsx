import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createNews, deleteNews, getNews, updateNews } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  category: "announcement",
  isPublished: true,
  isFeatured: false,
};

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => getNews({ limit: 50 }).then((res) => setItems(res.data?.articles || []));

  useEffect(() => {
    load().catch((err) => showError("Failed to load news", err.message));
  }, []);

  const onCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showError("Missing fields", "Title and content are required");
      return;
    }
    try {
      await createNews(form);
      showSuccess("Article published");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateNews(edit.id, {
        title: edit.title,
        excerpt: edit.excerpt,
        content: edit.content,
        category: edit.category,
      });
      showSuccess("Article updated");
      setEdit(null);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleFeatured = async (a) => {
    try {
      await updateNews(a.id, { isFeatured: !a.isFeatured });
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const togglePublished = async (a) => {
    try {
      await updateNews(a.id, { isPublished: !a.isPublished });
      showSuccess(a.isPublished ? "Article unpublished" : "Article published");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onDelete = async (a) => {
    const ok = await showConfirm("Delete article?", `Permanently delete "${a.title}"?`, "Delete");
    if (!ok) return;
    try {
      await deleteNews(a.id);
      showSuccess("Article deleted");
      load();
    } catch (err) {
      showError(err.message);
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
                <TableCell>
                  <Switch size="small" checked={!!a.isPublished} onChange={() => togglePublished(a)} />
                </TableCell>
                <TableCell>
                  <Switch size="small" checked={!!a.isFeatured} onChange={() => toggleFeatured(a)} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEdit({ ...a })}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(a)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No articles yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
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

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit article</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Title" fullWidth value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              <TextField
                label="Excerpt"
                fullWidth
                value={edit.excerpt || ""}
                onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })}
              />
              <TextField
                label="Category"
                fullWidth
                value={edit.category || ""}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
              />
              <TextField
                label="Content"
                fullWidth
                multiline
                minRows={4}
                value={edit.content || ""}
                onChange={(e) => setEdit({ ...edit, content: e.target.value })}
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
