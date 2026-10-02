export interface MoveConfig {
  allowedDays: string[];
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  noticePeriodDays: number;
}

export interface CommunityConfig {
  moveIn: MoveConfig;
  moveOut: MoveConfig;
}

export interface Community {
  id: string;
  name: string;
  config: CommunityConfig;
  createdAt: Date;
  updatedAt: Date;
}
