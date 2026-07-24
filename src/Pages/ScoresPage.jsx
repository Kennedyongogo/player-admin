import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { getScores, getTeams, getTournaments, submitScore, syncOverstat } from "../api";
import { colors } from "../theme";

export default function ScoresPage() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({
    teamId: "",
    matchNumber: 1,
    placement: 1,
    kills: 0,
    killPoints: 0,
    placementPoints: 0,
  });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

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
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [tournamentId]);

  const onSubmit = async () => {
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
      setMsg("Score submitted");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Live scores
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manual entry now — Overstat sync in Phase 3
      </Typography>
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
        <Button variant="outlined" onClick={() => syncOverstat(tournamentId).then((r) => setMsg(r.message))}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
