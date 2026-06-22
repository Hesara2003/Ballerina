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
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Edit2, PlusCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AdminSystem,
  AuditEntry,
  SystemPayload,
  activateSystem,
  createSystem,
  deactivateSystem,
  getAdminSystems,
  getAuditLog,
  updateSystem,
} from "@services/accessRequestApi";

const EMPTY: SystemPayload = { id: "", name: "", description: "", category: "", asgardeoGroupId: "" };

export default function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [systems, setSystems] = useState<AdminSystem[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSystem | null>(null);
  const [form, setForm] = useState<SystemPayload>(EMPTY);

  const load = async () => {
    try {
      setLoading(true);
      const [sys, log] = await Promise.all([getAdminSystems(), getAuditLog()]);
      setSystems(sys);
      setAudit(log);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (sys: AdminSystem) => {
    setEditing(sys);
    setForm({ id: sys.id, name: sys.name, description: sys.description, category: sys.category, asgardeoGroupId: sys.asgardeoGroupId });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.id || !form.name) return;
    try {
      setSaving(true);
      const updated = editing ? await updateSystem(editing.id, form) : await createSystem(form);
      setSystems(updated);
      setDialogOpen(false);
    } catch (err: unknown) {
      setError((err as { response?: { data?: string } })?.response?.data ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (sys: AdminSystem) => {
    try {
      const updated = sys.isActive
        ? await deactivateSystem(sys.id)
        : await activateSystem(sys.id);
      setSystems(updated);
    } catch {
      setError("Toggle failed.");
    }
  };

  const auditColumns: GridColDef[] = [
    { field: "createdAt", headerName: "Time", width: 180, renderCell: (p) => new Date(p.value).toLocaleString() },
    { field: "action", headerName: "Action", width: 180, renderCell: (p) => (
      <Chip label={p.value} size="small" sx={{ fontSize: "0.72rem", fontWeight: 700 }} />
    )},
    { field: "performedBy", headerName: "By", flex: 1 },
    { field: "details", headerName: "Details", flex: 2 },
  ];

  if (loading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={3}>Admin Panel</Typography>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: "1px solid #e5e7eb" }}>
        <Tab label="Systems" />
        <Tab label="Audit Log" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>All Systems</Typography>
            <Button variant="contained" startIcon={<PlusCircle size={16} />} onClick={openAdd}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
              Add System
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {systems.map((sys) => (
              <Paper key={sys.id} elevation={0} sx={{
                p: 2.5, border: "1px solid", borderRadius: 2.5,
                borderColor: sys.isActive ? "#e5e7eb" : "#fca5a5",
                bgcolor: sys.isActive ? "white" : "#fef2f2",
                opacity: sys.isActive ? 1 : 0.8,
              }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography fontWeight={700} color="#111">{sys.name}</Typography>
                      <Chip label={sys.category} size="small" sx={{ fontSize: "0.7rem" }} />
                      {!sys.isActive && <Chip label="Inactive" size="small" color="error" sx={{ fontSize: "0.7rem" }} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" fontSize="0.83rem">{sys.description}</Typography>
                    <Typography variant="caption" color="#aaa" display="block" mt={0.5}>
                      ID: {sys.id} · Group: {sys.asgardeoGroupId}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexShrink={0}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(sys)}><Edit2 size={16} /></IconButton>
                    </Tooltip>
                    <Tooltip title={sys.isActive ? "Deactivate" : "Activate"}>
                      <IconButton size="small" onClick={() => handleToggle(sys)} color={sys.isActive ? "default" : "success"}>
                        {sys.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ height: 600 }}>
          <DataGrid
            rows={audit}
            columns={auditColumns}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}
          />
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>{editing ? "Edit System" : "Add System"}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <TextField label="System ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!editing} fullWidth size="small" helperText={editing ? "ID cannot be changed" : "e.g. hr-system"} />
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth size="small" multiline rows={2} />
            <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth size="small" helperText="e.g. Engineering, Finance, HR" />
            <TextField label="Asgardeo Group ID" value={form.asgardeoGroupId} onChange={(e) => setForm({ ...form, asgardeoGroupId: e.target.value })}
              fullWidth size="small" helperText="From Asgardeo Console → Groups" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.id || !form.name || saving}
            sx={{ textTransform: "none", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
