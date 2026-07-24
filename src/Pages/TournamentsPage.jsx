import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
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
import {
  archiveTournament,
  createTournament,
  getTournaments,
  updateTournament,
} from "../api";
import { REGIONS, formatCategory, formatDate, formatPrize } from "../constants";
import StatusBadge from "../components/StatusBadge";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const CATEGORIES = [
  "challenger_circuit",
  "pro_league",
  "community_scrims",
  "invitational",
  "tier_one",
  "tier_two",
  "practice",
];

const STATUSES = ["draft", "open", "registration_closed", "live", "completed", "archived"];

export default function TournamentsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "community_scrims",
    regions: ["Singapore"],
    prizePool: 0,
    maxTeams: 20,
    status: "open",
    description: "",
    rules: "",
    requiresLogo: true,
    requireApproval: true,
    startsAt: "",
    registrationClosesAt: "",
    overstatCode: "",
  });

  const load = () =>
    getTournaments({ limit: 100 })
      .then((res) => setItems(res.data?.tournaments || []))
      .catch((err) => showError("Failed to load tournaments", err.message));

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!form.name.trim()) {
      showError("Name required", "Enter a tournament name");
      return;
    }
    try {
      await createTournament({
        ...form,
        prizePool: Number(form.prizePool) || 0,
        maxTeams: Number(form.maxTeams) || null,
        startsAt: form.startsAt || null,
        registrationClosesAt: form.registrationClosesAt || null,
      });
      showSuccess("Tournament created");
      setOpen(false);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateTournament(edit.id, {
        name: edit.name,
        status: edit.status,
        category: edit.category,
        prizePool: edit.prizePool,
        maxTeams: edit.maxTeams,
        overstatCode: edit.overstatCode,
        description: edit.description,
      });
      showSuccess("Tournament updated");
      setEdit(null);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onArchive = async (t) => {
    const ok = await showConfirm("Archive tournament?", `Archive "${t.name}"?`, "Archive");
    if (!ok) return;
    try {
      await archiveTournament(t.id);
      showSuccess("Tournament archived");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
        <Box>
          <Typography variant="h4">Tournaments</Typography>
          <Typography color="text.secondary">Create and manage competitive events</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          + Create tournament
        </Button>
      </Stack>

      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prize</TableCell>
              <TableCell>Starts</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Typography fontWeight={700}>{t.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(t.regions || []).join(", ")}
                  </Typography>
                </TableCell>
                <TableCell>{formatCategory(t.category)}</TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>{Number(t.prizePool) > 0 ? formatPrize(t.prizePool, t.currency) : "—"}</TableCell>
                <TableCell>{formatDate(t.startsAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEdit(t)}>
                    Edit
                  </Button>
                  <Button size="small" color="warning" onClick={() => onArchive(t)}>
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No tournaments yet. Create one or run the API seed.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create tournament</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {formatCategory(c)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.filter((s) => s !== "archived").map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Primary region</InputLabel>
              <Select
                label="Primary region"
                value={form.regions[0] || ""}
                onChange={(e) => setForm({ ...form, regions: [e.target.value] })}
              >
                {REGIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Prize pool"
              type="number"
              fullWidth
              value={form.prizePool}
              onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
            />
            <TextField
              label="Max teams"
              type="number"
              fullWidth
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: e.target.value })}
            />
            <TextField
              label="Starts at"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <TextField
              label="Registration closes"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.registrationClosesAt}
              onChange={(e) => setForm({ ...form, registrationClosesAt: e.target.value })}
            />
            <TextField
              label="Overstat code"
              fullWidth
              value={form.overstatCode}
              onChange={(e) => setForm({ ...form, overstatCode: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
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

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit tournament</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" fullWidth value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Overstat code"
                fullWidth
                value={edit.overstatCode || ""}
                onChange={(e) => setEdit({ ...edit, overstatCode: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={edit.description || ""}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
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
