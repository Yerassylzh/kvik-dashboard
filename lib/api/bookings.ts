import { apiClient } from './client';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';

export interface BookingDto {
  id: string;
  workspaceId?: string;
  staffId?: string | null;
  staffName?: string | null;
  leadId?: string | null;
  serviceName?: string | null;
  price?: string | number | null;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  durationMinutes: number;
  status: BookingStatus;
  notes?: string | null;
}

export interface TimeSlot {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  staffId?: string;
  slots: TimeSlot[];
}

export interface FilterBookingsParams {
  from: string;
  to: string;
  staffId?: string;
  status?: BookingStatus;
}

export interface CreateBookingPayload {
  staffId?: string;
  leadId?: string;
  serviceName: string;
  price?: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  startTime: string; // ISO datetime
  durationMinutes: number;
  notes?: string;
}

export interface RescheduleBookingPayload {
  startTime: string; // ISO datetime
  durationMinutes: number;
}

export const bookingsApi = {
  getBookings: async (params: FilterBookingsParams): Promise<BookingDto[]> => {
    const { data } = await apiClient.get<BookingDto[]>('/bookings', { params });
    return data;
  },

  getAvailableSlots: async (params: {
    staffId?: string;
    date: string; // YYYY-MM-DD
    durationMinutes: number;
  }): Promise<AvailableSlotsResponse> => {
    const { data } = await apiClient.get<AvailableSlotsResponse>('/bookings/slots', { params });
    return data;
  },

  createBooking: async (payload: CreateBookingPayload): Promise<BookingDto> => {
    const { data } = await apiClient.post<BookingDto>('/bookings', payload);
    return data;
  },

  getBooking: async (id: string): Promise<BookingDto> => {
    const { data } = await apiClient.get<BookingDto>(`/bookings/${id}`);
    return data;
  },

  updateStatus: async (
    id: string,
    status: BookingStatus
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(`/bookings/${id}/status`, {
      status,
    });
    return data;
  },

  reschedule: async (
    id: string,
    payload: RescheduleBookingPayload
  ): Promise<{ code: string; message: string }> => {
    const { data } = await apiClient.patch<{ code: string; message: string }>(
      `/bookings/${id}/reschedule`,
      payload
    );
    return data;
  },
};
