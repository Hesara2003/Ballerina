import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";

export interface SystemResource {
  id: string;
  name: string;
  description: string;
  category: string;
  asgardeoGroupId: string;
}

export interface AdminSystem extends SystemResource {
  isActive: boolean;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  systemId: string;
  systemName: string;
  asgardeoGroupId: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface SystemStat {
  systemName: string;
  pending: number;
  approved: number;
  rejected: number;
}

export interface DayStat {
  date: string;
  count: number;
}

export interface AnalyticsData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  bySystem: SystemStat[];
  recentActivity: DayStat[];
}

export interface AuditEntry {
  id: number;
  action: string;
  performedBy: string;
  performedByEmail: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface SystemPayload {
  id: string;
  name: string;
  description: string;
  category: string;
  asgardeoGroupId: string;
}

const api = () => APIService.getInstance();

export const getSystems = (): Promise<SystemResource[]> =>
  api().get(AppConfig.serviceUrls.systems).then((r) => r.data);

export const getRequests = (): Promise<AccessRequest[]> =>
  api().get(AppConfig.serviceUrls.requests).then((r) => r.data);

export const submitRequest = (systemId: string, justification: string): Promise<AccessRequest> =>
  api().post(AppConfig.serviceUrls.requests, { systemId, justification }).then((r) => r.data);

export const approveRequest = (id: string, comment: string): Promise<AccessRequest> =>
  api().put(AppConfig.serviceUrls.approveRequest(id), { comment }).then((r) => r.data);

export const rejectRequest = (id: string, comment: string): Promise<AccessRequest> =>
  api().put(AppConfig.serviceUrls.rejectRequest(id), { comment }).then((r) => r.data);

export const getAnalytics = (): Promise<AnalyticsData> =>
  api().get(AppConfig.serviceUrls.analytics).then((r) => r.data);

export const getAdminSystems = (): Promise<AdminSystem[]> =>
  api().get(AppConfig.serviceUrls.adminSystems).then((r) => r.data);

export const createSystem = (payload: SystemPayload): Promise<AdminSystem[]> =>
  api().post(AppConfig.serviceUrls.adminSystems, payload).then((r) => r.data);

export const updateSystem = (id: string, payload: SystemPayload): Promise<AdminSystem[]> =>
  api().put(AppConfig.serviceUrls.adminSystem(id), payload).then((r) => r.data);

export const deactivateSystem = (id: string): Promise<AdminSystem[]> =>
  api().delete(AppConfig.serviceUrls.adminSystem(id)).then((r) => r.data);

export const activateSystem = (id: string): Promise<AdminSystem[]> =>
  api().put(AppConfig.serviceUrls.activateSystem(id), {}).then((r) => r.data);

export const getAuditLog = (): Promise<AuditEntry[]> =>
  api().get(AppConfig.serviceUrls.auditLog).then((r) => r.data);
