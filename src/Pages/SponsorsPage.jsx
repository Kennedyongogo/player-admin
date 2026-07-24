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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { createSponsor, getSponsors, updateSponsor } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const TIERS = ["title", "gold", "silver", "bronze", "partner"];

export default function SponsorsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tier: "partner", websiteUrl: "", description: "", isFeatured: true });

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
                <TableCell>{s.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell>{s.isActive ? "Yes" : "No"}</TableCell>
                <TableCell>{s.clickCount}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => toggleActive(s)}>
                    {s.isActive ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
            <TextField
              label="Description"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
