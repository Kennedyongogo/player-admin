import { useEffect, useState } from "react";
import {
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
import { getLeaderboards, getTeams, getTournaments, upsertLeaderboardEntry } from "../api";
import { colors } from "../theme";
import { showError, showSuccess } from "../utils/swal";

export default function LeaderboardsPage() {
  const [type, setType] = useState("weekly");
  const [entries, setEntries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({
    teamId: "",
    tournamentId: "",
    rank: 1,
    killPoints: 0,
    placementPoints: 0,
    totalPoints: 0,
    averagePoints: 0,
  });

  const load = () =>
    getLeaderboards({ type, limit: 100 })
      .then((res) => setEntries(res.data?.entries || []))
      .catch((err) => showError("Failed to load leaderboard", err.message));

  useEffect(() => {
    load();
  }, [type]);

  useEffect(() => {
    Promise.all([getTeams({ limit: 100 }), getTournaments({ limit: 100 })]).then(([t, tour]) => {
      setTeams(t.data?.teams || []);
      setTournaments(tour.data?.tournaments || []);
    });
  }, []);

  const onUpsert = async () => {
    if (!form.teamId) {
      showError("Team required", "Select a team before saving");
      return;
    }
    try {
      await upsertLeaderboardEntry({
        type,
        teamId: form.teamId || null,
        tournamentId: form.tournamentId || null,
        rank: Number(form.rank),
        killPoints: Number(form.killPoints),
        placementPoints: Number(form.placementPoints),
        totalPoints: Number(form.totalPoints),
        averagePoints: Number(form.averagePoints),
      });
      showSuccess("Leaderboard entry saved");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Leaderboards
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage ranking entries shown on the public portal
      </Typography>

      <FormControl sx={{ mb: 2, minWidth: 180 }}>
        <InputLabel>Type</InputLabel>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="regional">Regional</MenuItem>
          <MenuItem value="tournament">Tournament</MenuItem>
          <MenuItem value="live">Live</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ p: 2, mb: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upsert entry
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Team</InputLabel>
            <Select label="Team" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Tournament</InputLabel>
            <Select
              label="Tournament"
              value={form.tournamentId}
              onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {tournaments.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Rank" type="number" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
          <TextField label="Kills" type="number" value={form.killPoints} onChange={(e) => setForm({ ...form, killPoints: e.target.value })} />
          <TextField
            label="Placement"
            type="number"
            value={form.placementPoints}
            onChange={(e) => setForm({ ...form, placementPoints: e.target.value })}
          />
          <TextField label="Total" type="number" value={form.totalPoints} onChange={(e) => setForm({ ...form, totalPoints: e.target.value })} />
          <TextField label="Avg" type="number" value={form.averagePoints} onChange={(e) => setForm({ ...form, averagePoints: e.target.value })} />
          <Button variant="contained" onClick={onUpsert}>
            Save
          </Button>
        </Stack>
      </Box>

      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Kills</TableCell>
              <TableCell>Placement</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Avg</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>#{e.rank}</TableCell>
                <TableCell>{e.Team?.name}</TableCell>
                <TableCell>{e.killPoints}</TableCell>
                <TableCell>{e.placementPoints}</TableCell>
                <TableCell>{e.totalPoints}</TableCell>
                <TableCell>{e.averagePoints ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
