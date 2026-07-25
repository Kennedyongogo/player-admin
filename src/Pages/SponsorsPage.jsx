import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
import { createSponsor, deleteSponsor, getSponsors, updateSponsor, uploadFile } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const TIERS = ["title", "gold", "silver", "bronze", "partner"];

const EMPTY_FORM = {
  name: "",
  tier: "partner",
  websiteUrl: "",
  logoUrl: "",
  bannerUrl: "",
  description: "",
  isFeatured: true,
  sortOrder: 0,
};

export default function SponsorsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const load = () => getSponsors().then((res) => setItems(res.data?.sponsors || []));

  useEffect(() => {
    load().catch((err) => showError("Failed to load sponsors", err.message));
  }, []);

  const onCreate = async () => {
    if (!form.name.trim()) {
      showError("Name required", "Enter a sponsor name");
      return;
    }
    try {
      await createSponsor(form);
      showSuccess("Sponsor created");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateSponsor(edit.id, {
        name: edit.name,
        tier: edit.tier,
        websiteUrl: edit.websiteUrl,
        logoUrl: edit.logoUrl,
        bannerUrl: edit.bannerUrl,
        description: edit.description,
        isFeatured: edit.isFeatured,
        sortOrder: Number(edit.sortOrder) || 0,
      });
      showSuccess("Sponsor updated");
      setEdit(null);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onUpload = async (kind, file, target, setTarget) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(kind, file);
      setTarget({ ...target, [kind === "logo" ? "logoUrl" : "bannerUrl"]: res.data.url });
      showSuccess("File uploaded");
    } catch (err) {
      showError("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleFeatured = async (s) => {
    try {
      await updateSponsor(s.id, { isFeatured: !s.isFeatured });
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleActive = async (s) => {
    if (s.isActive) {
      const ok = await showConfirm("Disable sponsor?", `Disable ${s.name}?`);
      if (!ok) return;
    }
    try {
      await updateSponsor(s.id, { isActive: !s.isActive });
      showSuccess(s.isActive ? "Sponsor disabled" : "Sponsor enabled");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onDelete = async (s) => {
    const ok = await showConfirm("Delete sponsor?", `Permanently delete ${s.name}?`, "Delete");
    if (!ok) return;
    try {
      await deleteSponsor(s.id);
      showSuccess("Sponsor deleted");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Sponsors</Typography>
          <Typography color="text.secondary">Partner visibility management</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          + Add sponsor
        </Button>
      </Stack>
      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Clicks</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.tier}</TableCell>
                <TableCell>
                  <Switch size="small" checked={!!s.isFeatured} onChange={() => toggleFeatured(s)} />
                </TableCell>
                <TableCell>{s.isActive ? "Yes" : "No"}</TableCell>
                <TableCell>{s.clickCount}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEdit({ ...s })}>
                    Edit
                  </Button>
                  <Button size="small" onClick={() => toggleActive(s)}>
                    {s.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(s)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No sponsors yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add sponsor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                {TIERS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Website" fullWidth value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            <TextField label="Logo URL" fullWidth value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            <Button component="label" variant="outlined" disabled={uploading} size="small">
              {uploading ? "Uploading..." : "Upload logo"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onUpload("logo", e.target.files?.[0], form, setForm)}
              />
            </Button>
            <TextField label="Banner URL" fullWidth value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
            <Button component="label" variant="outlined" disabled={uploading} size="small">
              {uploading ? "Uploading..." : "Upload banner"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onUpload("banner", e.target.files?.[0], form, setForm)}
              />
            </Button>
            <TextField
              label="Sort order"
              type="number"
              fullWidth
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <FormControlLabel
              control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />}
              label="Featured"
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
        <DialogTitle>Edit sponsor</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" fullWidth value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select label="Tier" value={edit.tier} onChange={(e) => setEdit({ ...edit, tier: e.target.value })}>
                  {TIERS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Website" fullWidth value={edit.websiteUrl || ""} onChange={(e) => setEdit({ ...edit, websiteUrl: e.target.value })} />
              <TextField label="Logo URL" fullWidth value={edit.logoUrl || ""} onChange={(e) => setEdit({ ...edit, logoUrl: e.target.value })} />
              <Button component="label" variant="outlined" disabled={uploading} size="small">
                {uploading ? "Uploading..." : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onUpload("logo", e.target.files?.[0], edit, setEdit)}
                />
              </Button>
              <TextField label="Banner URL" fullWidth value={edit.bannerUrl || ""} onChange={(e) => setEdit({ ...edit, bannerUrl: e.target.value })} />
              <Button component="label" variant="outlined" disabled={uploading} size="small">
                {uploading ? "Uploading..." : "Upload banner"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onUpload("banner", e.target.files?.[0], edit, setEdit)}
                />
              </Button>
              <TextField
                label="Sort order"
                type="number"
                fullWidth
                value={edit.sortOrder ?? 0}
                onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={edit.description || ""}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
              <FormControlLabel
                control={<Switch checked={!!edit.isFeatured} onChange={(e) => setEdit({ ...edit, isFeatured: e.target.checked })} />}
                label="Featured"
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
