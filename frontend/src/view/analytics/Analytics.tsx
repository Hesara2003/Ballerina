import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { BarChart3, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AnalyticsData, getAnalytics } from "@services/accessRequestApi";

const StatCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{ p: 3, border: "1px solid #e5e7eb", borderRadius: 3, flex: 1 }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ color }}>{icon}</Box>
    </Stack>
    <Typography variant="h3" fontWeight={800} color={color}>
      {value}
    </Typography>
  </Paper>
);

const BAR_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" pt={8}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const maxCount = Math.max(...data.bySystem.map((s) => s.pending + s.approved + s.rejected), 1);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={3}>
        Analytics
      </Typography>

      {/* Stat cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
        <StatCard label="Total Requests" value={data.total} color="#6366f1" icon={<BarChart3 size={22} />} />
        <StatCard label="Pending" value={data.pending} color="#f59e0b" icon={<Clock size={22} />} />
        <StatCard label="Approved" value={data.approved} color="#10b981" icon={<CheckCircle2 size={22} />} />
        <StatCard label="Rejected" value={data.rejected} color="#ef4444" icon={<XCircle size={22} />} />
      </Stack>

      <Grid container spacing={3}>
        {/* Requests by system */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <Typography fontWeight={700} mb={2.5}>
              Requests by System
            </Typography>
            {data.bySystem.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No data yet.</Typography>
            ) : (
              <Stack spacing={2}>
                {data.bySystem.map((sys) => {
                  const total = sys.pending + sys.approved + sys.rejected;
                  return (
                    <Box key={sys.systemName}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600} color="#374151">
                          {sys.systemName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {total} total
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ height: 10, borderRadius: 1, overflow: "hidden", bgcolor: "#f3f4f6" }}>
                        {(["approved", "pending", "rejected"] as const).map((key) => {
                          const val = sys[key];
                          if (val === 0) return null;
                          return (
                            <Box
                              key={key}
                              sx={{
                                width: `${(val / maxCount) * 100}%`,
                                bgcolor: BAR_COLORS[key],
                                transition: "width 0.4s",
                              }}
                            />
                          );
                        })}
                      </Stack>
                      <Stack direction="row" spacing={2} mt={0.5}>
                        {(["approved", "pending", "rejected"] as const).map((key) => (
                          <Typography key={key} variant="caption" sx={{ color: BAR_COLORS[key] }}>
                            {sys[key]} {key}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Recent activity */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #e5e7eb", borderRadius: 3, height: "100%" }}>
            <Typography fontWeight={700} mb={2.5}>
              Recent Activity (last 30 days)
            </Typography>
            {data.recentActivity.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No data yet.</Typography>
            ) : (
              <Stack spacing={1} sx={{ maxHeight: 360, overflowY: "auto" }}>
                {[...data.recentActivity].reverse().map((day) => {
                  const maxDay = Math.max(...data.recentActivity.map((d) => d.count), 1);
                  return (
                    <Stack key={day.date} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }}>
                        {day.date}
                      </Typography>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: "#6366f1",
                          width: `${(day.count / maxDay) * 100}%`,
                          minWidth: 4,
                          transition: "width 0.3s",
                        }}
                      />
                      <Typography variant="caption" fontWeight={700} color="#374151" sx={{ flexShrink: 0 }}>
                        {day.count}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Approval rate */}
        {data.total > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e5e7eb", borderRadius: 3 }}>
              <Typography fontWeight={700} mb={2}>
                Overall Approval Rate
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ flex: 1, height: 14, borderRadius: 2, overflow: "hidden", bgcolor: "#f3f4f6", display: "flex" }}>
                  <Box sx={{ width: `${(data.approved / data.total) * 100}%`, bgcolor: "#10b981" }} />
                  <Box sx={{ width: `${(data.pending / data.total) * 100}%`, bgcolor: "#f59e0b" }} />
                  <Box sx={{ width: `${(data.rejected / data.total) * 100}%`, bgcolor: "#ef4444" }} />
                </Box>
                <Typography fontWeight={700} color="#10b981">
                  {Math.round((data.approved / data.total) * 100)}%
                </Typography>
              </Stack>
              <Stack direction="row" spacing={3} mt={1.5}>
                {[
                  { label: "Approved", value: data.approved, color: "#10b981" },
                  { label: "Pending", value: data.pending, color: "#f59e0b" },
                  { label: "Rejected", value: data.rejected, color: "#ef4444" },
                ].map(({ label, value, color }) => (
                  <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                    <Typography variant="caption" color="text.secondary">
                      {label}: <strong>{value}</strong>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 4 }} />
    </Box>
  );
}
