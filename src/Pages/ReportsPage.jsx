import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getReports } from "../api";
import { colors } from "../theme";
import { showError } from "../utils/swal";

export default function ReportsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getReports()
      .then((res) => setData(res.data))
      .catch((err) => showError("Failed to load reports", err.message));
  }, []);

  const sections = [
    { title: "Registrations by status", rows: data?.registrationsByStatus, labelKey: "status" },
    { title: "Tournaments by category", rows: data?.tournamentsByCategory, labelKey: "category" },
    { title: "Teams by region", rows: data?.teamsByRegion, labelKey: "region" },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Reports
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Aggregated platform analytics
      </Typography>

      <Box
        sx={{
          mx: { xs: -2, md: -3 },
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.5, md: 2 },
          bgcolor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          backgroundImage: `
            linear-gradient(180deg, rgba(124,58,237,0.08), transparent 70%),
            linear-gradient(90deg, rgba(0,194,255,0.04), transparent 40%)
          `,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 1.5, md: 2 },
            width: "100%",
          }}
        >
          {sections.map((section) => (
            <Box
              key={section.title}
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 2.5,
                border: `1px solid ${colors.border}`,
                bgcolor: colors.elevated,
                minHeight: 160,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: "1rem", md: "1.1rem" } }}>
                {section.title}
              </Typography>
              {(section.rows || []).length === 0 ? (
                <Typography color="text.secondary">No data</Typography>
              ) : (
                <Stack spacing={0}>
                  {section.rows.map((r, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 1,
                        borderBottom: i < section.rows.length - 1 ? `1px solid ${colors.border}` : "none",
                      }}
                    >
                      <Typography sx={{ textTransform: "capitalize" }}>{r[section.labelKey]}</Typography>
                      <Typography fontWeight={700}>{r.count}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
