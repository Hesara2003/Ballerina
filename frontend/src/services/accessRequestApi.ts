import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";

export interface SystemResource {
  id: string;
  name: string;
  description: string;
  category: string;
  asgardeoGroupId: string;
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

export const getSystems = (): Promise<SystemResource[]> =>
  APIService.getInstance()
    .get(AppConfig.serviceUrls.systems)
    .then((r) => r.data);

export const getRequests = (): Promise<AccessRequest[]> =>
  APIService.getInstance()
    .get(AppConfig.serviceUrls.requests)
    .then((r) => r.data);

export const submitRequest = (systemId: string, justification: string): Promise<AccessRequest> =>
  APIService.getInstance()
    .post(AppConfig.serviceUrls.requests, { systemId, justification })
    .then((r) => r.data);

export const approveRequest = (id: string, comment: string): Promise<AccessRequest> =>
  APIService.getInstance()
    .put(AppConfig.serviceUrls.approveRequest(id), { comment })
    .then((r) => r.data);

export const rejectRequest = (id: string, comment: string): Promise<AccessRequest> =>
  APIService.getInstance()
    .put(AppConfig.serviceUrls.rejectRequest(id), { comment })
    .then((r) => r.data);
