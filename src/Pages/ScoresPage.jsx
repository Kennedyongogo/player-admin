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
import { deleteScore, getScores, getTeams, getTournaments, submitScore, syncOverstat, updateScore } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

export default function ScoresPage() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [scores, setScores] = useState([]);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    teamId: "",
    matchNumber: 1,
    placement: 1,
    kills: 0,
    killPoints: 0,
    placementPoints: 0,
  });

  useEffect(() => {
    Promise.all([getTournaments({ limit: 100 }), getTeams({ limit: 100 })]).then(([t, teamsRes]) => {
      const list = t.data?.tournaments || [];
      setTournaments(list);
      setTeams(teamsRes.data?.teams || []);
      if (list[0]) setTournamentId(list[0].id);
    });
  }, []);

  const load = () => {
    if (!tournamentId) return;
    getScores({ tournamentId })
      .then((res) => setScores(res.data?.scores || []))
      .catch((err) => showError("Failed to load scores", err.message));
  };

  useEffect(() => {
    load();
  }, [tournamentId]);

  const onSubmit = async () => {
    if (!form.teamId) {
      showError("Team required", "Select a team before submitting");
      return;
    }
    try {
      await submitScore({
        tournamentId,
        teamId: form.teamId,
        matchNumber: Number(form.matchNumber),
        placement: Number(form.placement),
        kills: Number(form.kills),
        killPoints: Number(form.killPoints),
        placementPoints: Number(form.placementPoints),
        totalPoints: Number(form.killPoints) + Number(form.placementPoints),
      });
      showSuccess("Score submitted");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSyncOverstat = async () => {
    try {
      const r = await syncOverstat(tournamentId);
      showSuccess("Overstat sync", r.message);
      load();
    } catch (err) {
      showError("Sync failed", err.message);
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateScore(edit.id, {
        placement: Number(edit.placement),
        kills: Number(edit.kills),
        killPoints: Number(edit.killPoints),
        placementPoints: Number(edit.placementPoints),
      });
      showSuccess("Score updated");
      setEdit(null);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const onDelete = async (s) => {
    const ok = await showConfirm("Delete score?", `Delete match ${s.matchNumber} score for ${s.Team?.name}?`, "Delete");
    if (!ok) return;
    try {
      await deleteScore(s.id);
      showSuccess("Score deleted");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Live scores
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manual entry, or sync from Overstat (accepts optional standings payload)
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel>Tournament</InputLabel>
          <Select label="Tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={onSyncOverstat}>
          Sync Overstat
        </Button>
      </Stack>

      <Box sx={{ p: 2, mb: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Submit score
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Team</InputLabel>
            <Select label="Team" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Match #" type="number" value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} />
          <TextField label="Placement" type="number" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} />
          <TextField label="Kills" type="number" value={form.kills} onChange={(e) => setForm({ ...form, kills: e.target.value })} />
          <TextField label="Kill pts" type="number" value={form.killPoints} onChange={(e) => setForm({ ...form, killPoints: e.target.value })} />
          <TextField
            label="Place pts"
            type="number"
            value={form.placementPoints}
            onChange={(e) => setForm({ ...form, placementPoints: e.target.value })}
          />
          <Button variant="contained" onClick={onSubmit}>
            Add
          </Button>
        </Stack>
      </Box>

      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Match</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Placement</TableCell>
              <TableCell>Kills</TableCell>
              <TableCell>Kill pts</TableCell>
              <TableCell>Place pts</TableCell>
              <TableCell>Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.matchNumber}</TableCell>
                <TableCell>{s.Team?.name}</TableCell>
                <TableCell>{s.placement}</TableCell>
                <TableCell>{s.kills}</TableCell>
                <TableCell>{s.killPoints}</TableCell>
                <TableCell>{s.placementPoints}</TableCell>
                <TableCell>
                  <strong>{s.totalPoints}</strong>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEdit(s)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(s)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit score</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Placement"
                type="number"
                fullWidth
                value={edit.placement}
                onChange={(e) => setEdit({ ...edit, placement: e.target.value })}
              />
              <TextField
                label="Kills"
                type="number"
                fullWidth
                value={edit.kills}
                onChange={(e) => setEdit({ ...edit, kills: e.target.value })}
              />
              <TextField
                label="Kill pts"
                type="number"
                fullWidth
                value={edit.killPoints}
                onChange={(e) => setEdit({ ...edit, killPoints: e.target.value })}
              />
              <TextField
                label="Placement pts"
                type="number"
                fullWidth
                value={edit.placementPoints}
                onChange={(e) => setEdit({ ...edit, placementPoints: e.target.value })}
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
