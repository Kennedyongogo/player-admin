import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { getReports } from "../api";
import { colors } from "../theme";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReports()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const Section = ({ title, rows, labelKey }) => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {(rows || []).length === 0 && <Typography color="text.secondary">No data</Typography>}
        {(rows || []).map((r, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              py: 1,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Typography>{r[labelKey]}</Typography>
            <Typography fontWeight={700}>{r.count}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Reports
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aggregated platform analytics
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Section title="Registrations by status" rows={data?.registrationsByStatus} labelKey="status" />
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Tournaments by category" rows={data?.tournamentsByCategory} labelKey="category" />
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Teams by region" rows={data?.teamsByRegion} labelKey="region" />
        </Grid>
      </Grid>
    </Box>
  );
}
