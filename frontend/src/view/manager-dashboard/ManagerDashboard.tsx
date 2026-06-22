import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, Clock, Search, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AccessRequest,
  approveRequest,
  getRequests,
  rejectRequest,
} from "@services/accessRequestApi";

type TabValue = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function ManagerDashboard() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tab, setTab] = useState<TabValue>("PENDING");
  const [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ req: AccessRequest; action: "approve" | "reject" } | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setRequests(await getRequests());
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = requests
    .filter((r) => tab === "ALL" || r.status === tab)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.employeeName.toLowerCase().includes(q) || r.employeeEmail.toLowerCase().includes(q) || r.systemName.toLowerCase().includes(q);
    });

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
    ALL: requests.length,
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    try {
      setSubmitting(true);
      const updated =
        reviewTarget.action === "approve"
          ? await approveRequest(reviewTarget.req.id, comment)
          : await rejectRequest(reviewTarget.req.id, comment);

      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSuccess(
        `Request for "${updated.systemName}" by ${updated.employeeName} ${
          reviewTarget.action === "approve" ? "approved" : "rejected"
        }.`
      );
      setReviewTarget(null);
    } catch {
      setError("Failed to process request.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Summary stats */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        {([
          { label: "Pending", value: counts.PENDING, color: "#f59e0b", icon: <Clock size={18} /> },
          { label: "Approved", value: counts.APPROVED, color: "#10b981", icon: <CheckCircle2 size={18} /> },
          { label: "Rejected", value: counts.REJECTED, color: "#ef4444", icon: <XCircle size={18} /> },
          { label: "Total", value: counts.ALL, color: "#6366f1", icon: <Users size={18} /> },
        ] as const).map(({ label, value, color, icon }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2.5, minWidth: 110, flex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5} color={color}>
              {icon}
              <Typography variant="caption" fontWeight={700} color={color} textTransform="uppercase" letterSpacing={0.5}>
                {label}
              </Typography>
            </Stack>
            <Typography fontSize="1.8rem" fontWeight={900} color="#111" lineHeight={1}>
              {value}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search by name, email or system..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
        InputProps={{ startAdornment: <Search size={16} color="#9ca3af" style={{ marginRight: 6 }} /> }}
      />

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: "1px solid #e5e7eb", minHeight: 40 }}
        TabIndicatorProps={{ style: { height: 2 } }}
      >
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((t) => (
          <Tab
            key={t}
            value={t}
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <span style={{ textTransform: "capitalize", fontSize: "0.85rem", fontWeight: 600 }}>
                  {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
                </span>
                {counts[t] > 0 && (
                  <Chip
                    label={counts[t]}
                    size="small"
                    sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700,
                      bgcolor: t === "PENDING" ? "#fff3cd" : t === "APPROVED" ? "#d1fae5" : t === "REJECTED" ? "#fee2e2" : "#ede9fe",
                      color: t === "PENDING" ? "#92400e" : t === "APPROVED" ? "#065f46" : t === "REJECTED" ? "#991b1b" : "#4c1d95",
                    }}
                  />
                )}
              </Stack>
            }
            sx={{ minHeight: 40, py: 0.5 }}
          />
        ))}
      </Tabs>

      {/* Request list */}
      {filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: "1px dashed #e5e7eb", borderRadius: 3, textAlign: "center" }}>
          <Typography color="#aaa">No {tab === "ALL" ? "" : tab.toLowerCase() + " "}requests.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {[...filtered].reverse().map((req) => (
            <Paper
              key={req.id}
              elevation={0}
              sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, "&:hover": { borderColor: "#d1d5db" } }}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
                {/* Left — requester + system */}
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                  <Avatar sx={{ bgcolor: "#6366f1", width: 38, height: 38, fontSize: "0.9rem" }}>
                    {req.employeeName?.[0] ?? "?"}
                  </Avatar>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={700} fontSize="0.92rem" color="#111">
                        {req.employeeName}
                      </Typography>
                      <Typography variant="caption" color="#999">
                        {req.employeeEmail}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="#555" fontSize="0.83rem">
                      Requested access to{" "}
                      <Box component="span" fontWeight={700} color="#111">
                        {req.systemName}
                      </Box>
                    </Typography>
                    {req.justification && (
                      <Typography variant="caption" color="#888" fontStyle="italic">
                        "{req.justification}"
                      </Typography>
                    )}
                    <Typography variant="caption" color="#bbb" display="block" mt={0.3}>
                      {new Date(req.requestedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>

                {/* Right — status + actions */}
                <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0}>
                  {req.status === "PENDING" ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircle2 size={14} />}
                        onClick={() => { setReviewTarget({ req, action: "approve" }); setComment(""); }}
                        sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, borderRadius: 1.5, px: 2 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<XCircle size={14} />}
                        onClick={() => { setReviewTarget({ req, action: "reject" }); setComment(""); }}
                        sx={{ textTransform: "none", fontWeight: 700, color: "#ef4444", borderColor: "#fca5a5", "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" }, borderRadius: 1.5, px: 2 }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Stack alignItems="flex-end" spacing={0.3}>
                      <Chip
                        label={req.status}
                        size="small"
                        icon={req.status === "APPROVED" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: req.status === "APPROVED" ? "#d1fae5" : "#fee2e2",
                          color: req.status === "APPROVED" ? "#065f46" : "#991b1b",
                          "& .MuiChip-icon": { color: req.status === "APPROVED" ? "#10b981" : "#ef4444" },
                        }}
                      />
                      {req.reviewedBy && (
                        <Typography variant="caption" color="#999" fontSize="0.7rem">
                          by {req.reviewedBy}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>
            {reviewTarget?.action === "approve" ? "Approve Request" : "Reject Request"}
          </Typography>
          {reviewTarget && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {reviewTarget.req.systemName} · requested by {reviewTarget.req.employeeName}
            </Typography>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            label="Comment (optional)"
            multiline
            rows={3}
            fullWidth
            placeholder={
              reviewTarget?.action === "approve"
                ? "Any notes about this approval..."
                : "Reason for rejection..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReviewTarget(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReview}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: reviewTarget?.action === "approve" ? "#10b981" : "#ef4444",
              "&:hover": { bgcolor: reviewTarget?.action === "approve" ? "#059669" : "#dc2626" },
            }}
          >
            {submitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : reviewTarget?.action === "approve" ? (
              "Confirm Approval"
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
