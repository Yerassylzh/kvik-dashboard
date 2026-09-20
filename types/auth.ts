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

export type SystemRole = 'OWNER' | 'ADMIN_MANAGER' | 'SPECIALIST';

export interface StaffProfileSummary {
  id: string;
  name: string;
  role?: string | null;
  systemRole: SystemRole;
  specializations?: string[];
}

export interface AccessibleWorkspaceDto {
  id: string;
  name: string;
  businessName: string;
  role: SystemRole;
  isOwner: boolean;
  plan: Plan | string;
  isActive: boolean;
}

export interface AvailableWorkspace {
  workspaceId: string;
  workspaceName: string;
  role: SystemRole;
  id?: string;
  name?: string;
  businessName?: string;
  isOwner?: boolean;
  plan?: Plan | string;
  isActive?: boolean;
}

export interface SwitchWorkspaceResponseDto {
  workspace: {
    id: string;
    name: string;
  };
  role: SystemRole;
  staffProfile?: StaffProfileSummary | null;
  access_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  role?: SystemRole;
  staffProfile?: StaffProfileSummary | null;
  createdAt: string;
  updatedAt: string;
  workspace?: Workspace | null;
  availableWorkspaces?: AvailableWorkspace[];
}

export interface TokenPayload {
  sub: string;
  workspaceId?: string;
  role?: SystemRole;
  staffMemberId?: string;
  plan?: Plan;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  expires_in?: number;
  isEmailVerified?: boolean;
  role?: SystemRole;
  staffProfile?: StaffProfileSummary | null;
  availableWorkspaces?: AvailableWorkspace[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ValidateStaffInviteResponse {
  valid: boolean;
  email: string;
  staffName: string;
  roleTitle?: string | null;
  systemRole: SystemRole;
  workspaceName: string;
  inviterName: string;
}

export interface RegisterStaffDto {
  token: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface SwitchWorkspaceDto {
  workspaceId: string;
}

