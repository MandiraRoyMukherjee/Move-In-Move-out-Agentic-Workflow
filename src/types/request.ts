export type RequestType = "MOVE_IN" | "MOVE_OUT";

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type ActorType = "RESIDENT" | "ADMIN" | "AGENT" | "SYSTEM";

export interface MoveRequest {
  id: string;
  requestNumber: string;
  type: RequestType;
  residentId: string;
  communityId: string;
  status: RequestStatus;
  moveDate?: string | null;
  moveTime?: string | null;
  apartmentNumber?: string | null;
  movingCompany?: string | null;
  vehicleDetails?: string | null;
  documents?: string | null;
  reason?: string | null;
  agentSummary?: string | null;
  agentRecommendation?: string | null;
  adminNotes?: string | null;
  conversationState?: string | null;
  createdAt: Date;
  updatedAt: Date;
  resident?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    apartmentNumber: string;
  };
  community?: {
    id: string;
    name: string;
    config: string;
  };
  auditLogs?: AuditLog[];
}

export interface AuditLog {
  id: string;
  requestId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  details?: string | null;
  createdAt: Date;
}

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  apartmentNumber: string;
  communityId: string;
  createdAt: Date;
  updatedAt: Date;
}
