import { apiClient } from './client';
import {
  OnboardingStateResponse,
  NicheProfile,
  BusinessProfileDto,
  DataSourceDto,
  DataSourceResponseDto,
  DataPreviewResponse,
  ChannelDto,
  QualificationDto,
} from '@/types/niche';

export async function getOnboardingState(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.get<OnboardingStateResponse>('/onboarding/state');
  return data;
}

export async function selectNicheStep(nicheProfile: NicheProfile): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/niche', {
    nicheProfile,
  });
  return data;
}

export async function submitBusinessProfile(dto: BusinessProfileDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/business-profile', dto);
  return data;
}

export async function submitDataSource(
  dto: DataSourceDto
): Promise<DataSourceResponseDto> {
  const { data } = await apiClient.post<DataSourceResponseDto>(
    '/onboarding/step/data-source',
    dto
  );
  return data;
}

export async function getDataPreview(): Promise<DataPreviewResponse> {
  const { data } = await apiClient.get<DataPreviewResponse>('/onboarding/step/data-preview');
  return data;
}

export async function confirmDataPreview(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/data-confirm');
  return data;
}

export async function submitChannel(dto: ChannelDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/channel', dto);
  return data;
}

export async function submitQualification(dto: QualificationDto): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>(
    '/onboarding/step/qualification',
    dto
  );
  return data;
}

export async function completeOnboarding(): Promise<OnboardingStateResponse> {
  const { data } = await apiClient.post<OnboardingStateResponse>('/onboarding/step/complete');
  return data;
}
