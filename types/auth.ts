import { NicheProfile } from './niche';

export type Plan = 'STARTER' | 'PRO' | 'VIP';

export interface Workspace {
  id: string;
  name: string;
  nicheProfile?: NicheProfile | null;
  knowledgeConfirmed: boolean;
  qualificationRulesSet: boolean;
  isActive: boolean;
  vipRequested: boolean;
  plan: Plan;
  metadata?: Record<string, unknown> | null;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  workspace?: Workspace | null;
}

export interface TokenPayload {
  sub: string;
  workspaceId?: string;
  plan?: Plan;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  expires_in?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}
