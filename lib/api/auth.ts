import { apiClient } from './client';
import { AuthResponse, LoginDto, RegisterDto, User } from '@/types/auth';

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
