import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getTeams } from "../api";
import { colors } from "../theme";

export default function TeamsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getTeams({ search, limit: 100 }).then((res) => setItems(res.data?.teams || []));
  }, [search]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Teams
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        All registered teams on the platform
      </Typography>
      <TextField
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 360 }}
        fullWidth
      />
      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Captain</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Logo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Typography fontWeight={700}>{t.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.tag}
                  </Typography>
                </TableCell>
                <TableCell>{t.region}</TableCell>
                <TableCell>{t.captain?.username}</TableCell>
                <TableCell>{(t.members || []).length}</TableCell>
                <TableCell>{t.logoUrl ? "Yes" : "Missing"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
