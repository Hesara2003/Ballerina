import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  Server,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  AccessRequest,
  SystemResource,
  getRequests,
  getSystems,
  submitRequest,
} from "@services/accessRequestApi";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Engineering: <GitBranch size={20} />,
  "Human Resources": <Users size={20} />,
  Finance: <BarChart3 size={20} />,
  Sales: <ShieldAlert size={20} />,
  Data: <Database size={20} />,
  Infrastructure: <Server size={20} />,
};

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  APPROVED: { label: "Approved", color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7" },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
} as const;

export default function EmployeeDashboard() {
  const [systems, setSystems] = useState<SystemResource[]>([]);
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemResource | null>(null);
  const [justification, setJustification] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [sys, reqs] = await Promise.all([getSystems(), getRequests()]);
      setSystems(sys);
      setMyRequests(reqs);
    } catch {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openRequestDialog = (system: SystemResource) => {
    setSelectedSystem(system);
    setJustification("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedSystem || !justification.trim()) return;
    try {
      setSubmitting(true);
      const newReq = await submitRequest(selectedSystem.id, justification.trim());
      setMyRequests((prev) => [...prev, newReq]);
      setSuccess(`Access request for "${selectedSystem.name}" submitted successfully.`);
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      setError(msg ?? "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingSystemIds = new Set(
    myRequests.filter((r) => r.status === "PENDING").map((r) => r.systemId)
  );
  const approvedSystemIds = new Set(
    myRequests.filter((r) => r.status === "APPROVED").map((r) => r.systemId)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Available systems */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Available Systems
      </Typography>
      <Grid container spacing={2} mb={5} alignItems="stretch">
        {systems.map((sys) => {
          const hasPending = pendingSystemIds.has(sys.id);
          const hasAccess = approvedSystemIds.has(sys.id);
          return (
            <Grid key={sys.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: "flex" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: hasAccess ? "#6ee7b7" : hasPending ? "#fcd34d" : "#e5e7eb",
                  borderRadius: 3,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  bgcolor: hasAccess ? "#f0fdf4" : hasPending ? "#fffbeb" : "white",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#374151",
                    }}
                  >
                    {CATEGORY_ICONS[sys.category] ?? <Server size={20} />}
                  </Box>
                  {hasAccess && <CheckCircle2 size={18} color="#10b981" />}
                  {hasPending && <Clock size={18} color="#f59e0b" />}
                </Stack>

                <Box flex={1}>
                  <Typography fontWeight={700} color="#111" fontSize="0.95rem">
                    {sys.name}
                  </Typography>
                  <Typography variant="caption" color="#888" display="block" mb={0.5}>
                    {sys.category}
                  </Typography>
                  <Typography variant="body2" color="#555" fontSize="0.83rem" lineHeight={1.6}>
                    {sys.description}
                  </Typography>
                </Box>

                <Tooltip
                  title={
                    hasAccess
                      ? "You already have access"
                      : hasPending
                      ? "Request pending approval"
                      : ""
                  }
                >
                  <span>
                    <Button
                      variant={hasAccess ? "text" : "outlined"}
                      size="small"
                      fullWidth
                      disabled={hasAccess || hasPending}
                      onClick={() => openRequestDialog(sys)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 1.5,
                        ...(hasAccess
                          ? { color: "#10b981" }
                          : hasPending
                          ? { color: "#f59e0b", borderColor: "#fcd34d" }
                          : {}),
                      }}
                    >
                      {hasAccess ? "Access Granted" : hasPending ? "Request Pending" : "Request Access"}
                    </Button>
                  </span>
                </Tooltip>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* My requests */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        My Requests
      </Typography>
      {myRequests.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: "1px dashed #e5e7eb", borderRadius: 3, textAlign: "center" }}>
          <Typography color="#aaa">No requests yet. Request access to a system above.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {[...myRequests].reverse().map((req) => {
            const sc = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
            return (
              <Paper
                key={req.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  border: `1px solid ${sc?.border}`,
                  borderRadius: 2.5,
                  bgcolor: sc.bg,
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography fontWeight={700} color="#111">
                        {req.systemName}
                      </Typography>
                      <Chip
                        label={sc.label}
                        size="small"
                        icon={
                          req.status === "APPROVED" ? <CheckCircle2 size={12} /> :
                          req.status === "REJECTED" ? <XCircle size={12} /> :
                          <Clock size={12} />
                        }
                        sx={{
                          bgcolor: "transparent",
                          border: `1px solid ${sc.border}`,
                          color: sc.color,
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          "& .MuiChip-icon": { color: sc.color },
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" color="#777">
                      Requested {new Date(req.requestedAt).toLocaleDateString()}
                    </Typography>
                    {req.justification && (
                      <Typography variant="body2" color="#555" mt={0.5} fontSize="0.83rem">
                        "{req.justification}"
                      </Typography>
                    )}
                  </Box>
                  {req.reviewedBy && (
                    <Box textAlign={{ sm: "right" }}>
                      <Typography variant="caption" color="#777" display="block">
                        {req.status === "APPROVED" ? "Approved" : "Rejected"} by
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="#444">
                        {req.reviewedBy}
                      </Typography>
                      {req.reviewComment && (
                        <Typography variant="caption" color="#888" display="block">
                          "{req.reviewComment}"
                        </Typography>
                      )}
                    </Box>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Submit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>Request Access</Typography>
          {selectedSystem && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {selectedSystem.name} · {selectedSystem.category}
            </Typography>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {selectedSystem?.description}
          </Typography>
          <TextField
            label="Business justification"
            multiline
            rows={4}
            fullWidth
            placeholder="Explain why you need access to this system..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${justification.length}/500`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!justification.trim() || submitting}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
