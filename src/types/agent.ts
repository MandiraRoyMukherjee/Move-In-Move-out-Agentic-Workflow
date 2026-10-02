export type AgentIntent =
  | "CREATE_MOVE_IN_REQUEST"
  | "CREATE_MOVE_OUT_REQUEST"
  | "UPDATE_REQUEST"
  | "CHECK_STATUS"
  | "CONFIRM_SUBMISSION"
  | "CANCEL"
  | "GENERAL_INQUIRY"
  | "UNKNOWN";

export interface AgentExtractedData {
  moveDate?: string;       // ISO date string YYYY-MM-DD
  moveTime?: string;       // HH:MM 24h
  apartmentNumber?: string;
  movingCompany?: string;
  vehicleDetails?: string;
  reason?: string;
}

export interface AgentResponse {
  intent: AgentIntent;
  extractedData: AgentExtractedData;
  missingFields: string[];
  nextQuestion: string | null;
  validationErrors: string[];
  isComplete: boolean;
  suggestedAlternative?: string | null;
  message: string;
  readyToSubmit?: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationState {
  requestId?: string;
  requestType?: "MOVE_IN" | "MOVE_OUT";
  collectedData: AgentExtractedData;
  messages: ConversationMessage[];
  isComplete: boolean;
  readyToSubmit: boolean;
}
