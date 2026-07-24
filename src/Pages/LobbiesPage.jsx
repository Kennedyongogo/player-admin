import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  assignLobbyTeam,
  closeLobby,
  createLobby,
  getLobbies,
  getRegistrations,
  getTournaments,
  lockLobby,
  regenerateLobbyCodes,
  startLobby,
} from "../api";
import StatusBadge from "../components/StatusBadge";
import { colors } from "../theme";

export default function LobbiesPage() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [lobbies, setLobbies] = useState([]);
  const [approvedTeams, setApprovedTeams] = useState([]);
  const [name, setName] = useState("Lobby A");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getTournaments({ limit: 100 }).then((res) => {
      const list = res.data?.tournaments || [];
      setTournaments(list);
      if (list[0]) setTournamentId(list[0].id);
    });
  }, []);

  const load = async () => {
    if (!tournamentId) return;
    try {
      const [lRes, rRes] = await Promise.all([
        getLobbies(tournamentId),
        getRegistrations(tournamentId, { status: "approved", limit: 100 }),
      ]);
      setLobbies(lRes.data?.lobbies || []);
      setApprovedTeams((rRes.data?.registrations || []).map((r) => r.Team).filter(Boolean));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [tournamentId]);

  const onCreate = async () => {
    try {
      await createLobby(tournamentId, { name, maxTeams: 20 });
      setMsg("Lobby created");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Lobby management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Assign teams and generate player / admin codes
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Tournament</InputLabel>
          <Select label="Tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Lobby name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="contained" onClick={onCreate}>
          Create lobby
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {lobbies.map((lobby) => (
          <Grid item xs={12} lg={6} key={lobby.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">{lobby.name}</Typography>
                  <StatusBadge status={lobby.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Admin code: <strong>{lobby.adminCode || "—"}</strong>
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                  <Button size="small" onClick={() => regenerateLobbyCodes(lobby.id).then(load)}>
                    Regen codes
                  </Button>
                  <Button size="small" onClick={() => lockLobby(lobby.id).then(load)}>
                    Lock
                  </Button>
                  <Button size="small" onClick={() => startLobby(lobby.id).then(load)}>
                    Start
                  </Button>
                  <Button size="small" color="warning" onClick={() => closeLobby(lobby.id).then(load)}>
                    Close
                  </Button>
                </Stack>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Assigned teams
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {(lobby.assignments || []).map((a) => (
                    <Box
                      key={a.id}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: colors.elevated,
                        border: `1px solid ${colors.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2">{a.Team?.name}</Typography>
                      <Typography variant="caption" color="secondary.main">
                        {a.playerCode}
                      </Typography>
                    </Box>
                  ))}
                  {(lobby.assignments || []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No teams assigned
                    </Typography>
                  )}
                </Stack>

                <FormControl fullWidth size="small">
                  <InputLabel>Assign approved team</InputLabel>
                  <Select
                    label="Assign approved team"
                    value=""
                    onChange={async (e) => {
                      try {
                        await assignLobbyTeam(lobby.id, { teamId: e.target.value });
                        setMsg("Team assigned");
                        load();
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                  >
                    {approvedTeams.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
