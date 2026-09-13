import { apiClient } from './client';
import {
  AuthResponse,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RegisterStaffDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SwitchWorkspaceDto,
  User,
  ValidateStaffInviteResponse,
  VerifyEmailDto,
} from '@/types/auth';

export async function loginApi(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', dto);
  return data;
}

export async function registerApi(dto: RegisterDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', dto);
  return data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function refreshApi(): Promise<{ access_token: string }> {
  const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh');
  return data;
}

export async function getMeApi(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function validateStaffInviteApi(token: string): Promise<ValidateStaffInviteResponse> {
  const { data } = await apiClient.get<ValidateStaffInviteResponse>('/auth/staff-invite', {
    params: { token },
  });
  return data;
}

export async function registerStaffApi(dto: RegisterStaffDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register-staff', dto);
  return data;
}

export async function switchWorkspaceApi(dto: SwitchWorkspaceDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/switch-workspace', dto);
  return data;
}

export async function verifyEmailApi(dto: VerifyEmailDto): Promise<{ code: string; message: string }> {
  const { data } = await apiClient.post('/auth/verify-email', dto);
  return data;
}

export async function resendVerificationApi(
  dto: ResendVerificationDto,
): Promise<{ code: string; message: string }> {
  const { data } = await apiClient.post('/auth/resend-verification', dto);
  return data;
}

export async function forgotPasswordApi(dto: ForgotPasswordDto): Promise<{ code: string; message: string }> {
  const { data } = await apiClient.post('/auth/forgot-password', dto);
  return data;
}

export async function resetPasswordApi(dto: ResetPasswordDto): Promise<{ code: string; message: string }> {
  const { data } = await apiClient.post('/auth/reset-password', dto);
  return data;
}

export async function changePasswordApi(dto: ChangePasswordDto): Promise<{ code: string; message: string }> {
  const { data } = await apiClient.post('/auth/change-password', dto);
  return data;
}

