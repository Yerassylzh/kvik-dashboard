import { apiClient } from './client';

export interface BusinessContextDto {
  businessType?: string | null;
  specialization?: string | null;
  keyDifferentiators?: string[];
  servicesOffered?: string[];
  pricingPolicy?: string | null;
  restrictions?: string[];
  teamSummary?: string | null;
  bookingPolicy?: string | null;
  cancellationPolicy?: string | null;
  contactInfo?: string | null;
  workingHours?: string | null;
}

export interface UpdateBusinessContextDto {
  businessType?: string;
  specialization?: string;
  keyDifferentiators?: string[];
  servicesOffered?: string[];
  pricingPolicy?: string;
  restrictions?: string[];
  teamSummary?: string;
  bookingPolicy?: string;
  cancellationPolicy?: string;
  contactInfo?: string;
  workingHours?: string;
}

export interface BusinessContextRegenerateResponse {
  code: string;
  message: string;
}

export const businessContextApi = {
  /**
   * Retrieve the current structured Layer 2 business summary JSON.
   */
  getBusinessContext: async (): Promise<BusinessContextDto> => {
    const { data } = await apiClient.get<BusinessContextDto>(
      '/knowledge-base/business-context'
    );
    return data;
  },

  /**
   * Update / manually fine-tune the business context summary.
   */
  updateBusinessContext: async (
    payload: UpdateBusinessContextDto
  ): Promise<BusinessContextDto> => {
    const { data } = await apiClient.put<BusinessContextDto>(
      '/knowledge-base/business-context',
      payload
    );
    return data;
  },

  /**
   * Trigger background BullMQ job to re-extract summary from all knowledge sources.
   */
  regenerateBusinessContext: async (): Promise<BusinessContextRegenerateResponse> => {
    const { data } = await apiClient.post<BusinessContextRegenerateResponse>(
      '/knowledge-base/business-context/regenerate'
    );
    return data;
  },
};
