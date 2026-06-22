import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AccessRequest, getRequests } from "@services/accessRequestApi";
import { Role } from "@slices/authSlice/auth";
import { useAppSelector } from "@slices/store";

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={14} /> },
  APPROVED: { label: "Approved", color: "#10b981", bg: "#ecfdf5", icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={14} /> },
} as const;

export default function ProfilePage() {
  const userInfo = useAppSelector((s) => s.auth.userInfo);
  const roles = useAppSelector((s) => s.auth.roles);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .catch(() => setError("Failed to load request history."))
      .finally(() => setLoading(false));
  }, []);

  const isManager = roles.includes(Role.ADMIN);
  const myRequests = requests.filter((r) => r.employeeId === userInfo?.sub);
  const approvedCount = myRequests.filter((r) => r.status === "APPROVED").length;
  const pendingCount = myRequests.filter((r) => r.status === "PENDING").length;

  const initials = (userInfo?.displayName ?? userInfo?.username ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box maxWidth={720}>
      {/* Profile card */}
      <Paper elevation={0} sx={{ p: 3.5, border: "1px solid #e5e7eb", borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: "#6366f1", fontSize: "1.4rem", fontWeight: 800 }}>
            {initials}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} color="#111">
              {userInfo?.displayName ?? userInfo?.username ?? "Unknown User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userInfo?.email ?? "—"}
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip label="Employee" size="small" sx={{ bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 700, fontSize: "0.7rem" }} />
              {isManager && (
                <Chip label="Manager" size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: "0.7rem" }} />
              )}
            </Stack>
          </Box>
          <Stack spacing={1} textAlign="right">
            <Box>
              <Typography variant="h4" fontWeight={800} color="#10b981">{approvedCount}</Typography>
              <Typography variant="caption" color="text.secondary">Approved</Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#f59e0b">{pendingCount}</Typography>
              <Typography variant="caption" color="text.secondary">Pending</Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Request history */}
      <Typography variant="h6" fontWeight={700} mb={2}>My Access History</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>}

      {!loading && myRequests.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, border: "1px dashed #e5e7eb", borderRadius: 3, textAlign: "center" }}>
          <Typography color="#aaa">No access requests yet.</Typography>
        </Paper>
      )}

      <Stack spacing={1.5}>
        {myRequests.map((req) => {
          const sc = STATUS_CONFIG[req.status];
          return (
            <Paper key={req.id} elevation={0} sx={{
              p: 2.5, border: `1px solid #e5e7eb`, borderRadius: 2.5,
              borderLeft: `4px solid ${sc.color}`,
            }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography fontWeight={700} color="#111">{req.systemName}</Typography>
                    <Chip
                      label={sc.label}
                      icon={sc.icon}
                      size="small"
                      sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: "0.72rem",
                        border: `1px solid ${sc.color}30`, "& .MuiChip-icon": { color: sc.color } }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                  </Typography>
                  {req.justification && (
                    <Typography variant="body2" color="#555" mt={0.5} fontSize="0.83rem">
                      "{req.justification}"
                    </Typography>
                  )}
                </Box>
                {req.reviewedBy && (
                  <Box textAlign={{ sm: "right" }} flexShrink={0}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {req.status === "APPROVED" ? "Approved" : "Rejected"} by
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="#444">{req.reviewedBy}</Typography>
                    {req.reviewedAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(req.reviewedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    {req.reviewComment && (
                      <Typography variant="caption" color="#888" display="block">"{req.reviewComment}"</Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
