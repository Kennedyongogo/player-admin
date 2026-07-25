import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createBracket,
  deleteBracket,
  getBrackets,
  getRegistrations,
  getTeams,
  getTournaments,
  setBracketMatch,
} from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const FORMATS = ["single_elim"];

export default function BracketsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [brackets, setBrackets] = useState([]);
  const [approvedTeams, setApprovedTeams] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [name, setName] = useState("Main Bracket");
  const [format, setFormat] = useState("single_elim");
  const [teamIds, setTeamIds] = useState([]);

  useEffect(() => {
    Promise.all([getTournaments({ limit: 100 }), getTeams({ limit: 200 })]).then(([tRes, teamsRes]) => {
      const list = tRes.data?.tournaments || [];
      setTournaments(list);
      if (list[0]) setTournamentId(list[0].id);
      const map = {};
      (teamsRes.data?.teams || []).forEach((t) => {
        map[t.id] = t;
      });
      setTeamsById(map);
    });
  }, []);

  const loadBrackets = () => {
    if (!tournamentId) return;
    getBrackets({ tournamentId })
      .then((res) => setBrackets(res.data?.brackets || []))
      .catch((err) => showError("Failed to load brackets", err.message));
  };

  useEffect(() => {
    if (!tournamentId) return;
    loadBrackets();
    getRegistrations(tournamentId, { status: "approved", limit: 100 })
      .then((res) => setApprovedTeams((res.data?.registrations || []).map((r) => r.Team).filter(Boolean)))
      .catch((err) => showError("Failed to load approved teams", err.message));
    setTeamIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const onCreate = async () => {
    if (!tournamentId) {
      showError("Tournament required", "Select a tournament first");
      return;
    }
    if (!name.trim()) {
      showError("Name required", "Enter a bracket name");
      return;
    }
    try {
      await createBracket({ tournamentId, name, format, teamIds });
      showSuccess("Bracket created");
      setName("Main Bracket");
      setTeamIds([]);
      loadBrackets();
    } catch (err) {
      showError(err.message);
    }
  };

  const onDelete = async (bracket) => {
    const ok = await showConfirm("Delete bracket?", `Permanently delete "${bracket.name}"?`, "Delete");
    if (!ok) return;
    try {
      await deleteBracket(bracket.id);
      showSuccess("Bracket deleted");
      loadBrackets();
    } catch (err) {
      showError(err.message);
    }
  };

  const onSetWinner = async (bracket, roundIndex, match, winnerId) => {
    try {
      await setBracketMatch(bracket.id, { roundIndex, matchId: match.id, winnerId });
      showSuccess("Match updated");
      loadBrackets();
    } catch (err) {
      showError(err.message);
    }
  };

  const teamName = (id) => (id ? teamsById[id]?.name || "TBD" : "TBD");

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Brackets
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Build single-elimination brackets and record match results
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
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
      </Stack>

      <Box sx={{ p: 2, mb: 3, borderRadius: 3, border: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create bracket
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ minWidth: 200 }} />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Format</InputLabel>
            <Select label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => (
                <MenuItem key={f} value={f}>
                  {f.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 260, flex: 1 }}>
            <InputLabel>Teams (approved)</InputLabel>
            <Select
              multiple
              label="Teams (approved)"
              value={teamIds}
              onChange={(e) => setTeamIds(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
              input={<OutlinedInput label="Teams (approved)" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={teamsById[id]?.name || id} />
                  ))}
                </Box>
              )}
            >
              {approvedTeams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Checkbox checked={teamIds.includes(t.id)} size="small" />
                  <ListItemText primary={t.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={onCreate}>
            Create
          </Button>
        </Stack>
      </Box>

      <Stack spacing={2}>
        {brackets.map((bracket) => (
          <Card key={bracket.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6">{bracket.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bracket.format?.replace(/_/g, " ")} · {bracket.status}
                  </Typography>
                </Box>
                <Button size="small" color="error" onClick={() => onDelete(bracket)}>
                  Delete
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
                {(bracket.rounds || []).map((round, roundIndex) => (
                  <Box key={roundIndex} sx={{ minWidth: 240 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {round.name}
                    </Typography>
                    <Stack spacing={1}>
                      {(round.matches || []).map((match) => (
                        <Box
                          key={match.id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: colors.elevated,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Button
                              fullWidth
                              size="small"
                              variant={match.winnerId === match.teamAId ? "contained" : "outlined"}
                              disabled={!match.teamAId}
                              onClick={() => onSetWinner(bracket, roundIndex, match, match.teamAId)}
                              sx={{ justifyContent: "flex-start" }}
                            >
                              {teamName(match.teamAId)}
                            </Button>
                            <Button
                              fullWidth
                              size="small"
                              variant={match.winnerId === match.teamBId ? "contained" : "outlined"}
                              disabled={!match.teamBId}
                              onClick={() => onSetWinner(bracket, roundIndex, match, match.teamBId)}
                              sx={{ justifyContent: "flex-start" }}
                            >
                              {teamName(match.teamBId)}
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
                {(bracket.rounds || []).length === 0 && (
                  <Typography color="text.secondary">No rounds generated</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
        {brackets.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No brackets for this tournament yet.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
