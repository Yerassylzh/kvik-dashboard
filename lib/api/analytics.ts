import { apiClient } from './client';

export interface FunnelStageItem {
  status: string;
  count: number;
  conversionRate?: number | null;
}

export interface AnalyticsFunnelResponse {
  stages: FunnelStageItem[];
}

export interface AnalyticsOverviewResponse {
  period: { from: string; to: string };
  leads: {
    total: number;
    new: number;
    qualified: number;
    appointmentSet: number;
    dealWon: number;
    dealLost: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    declined: number;
  };
  conversations: {
    total: number;
    botHandled: number;
    managerIntercepted: number;
    avgResponseTimeSeconds?: number | null;
  };
  revenue: {
    estimatedTotal: string;
    currency: string;
  };
}

export interface BookingsByDayResponse {
  data: Array<{
    date: string;
    total: number;
    confirmed: number;
    cancelled: number;
  }>;
}

export interface ChannelsAnalyticsResponse {
  WHATSAPP?: { conversations: number; messages: number };
  INSTAGRAM?: { conversations: number; messages: number };
  TELEGRAM?: { conversations: number; messages: number };
}

export interface StaffPerformanceItem {
  staffId: string;
  staffName: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  estimatedRevenue: string;
}

export const analyticsApi = {
  getOverview: async (from: string, to: string): Promise<AnalyticsOverviewResponse> => {
    const { data } = await apiClient.get<AnalyticsOverviewResponse>('/analytics/overview', {
      params: { from, to },
    });
    return data;
  },

  getFunnel: async (from: string, to: string): Promise<AnalyticsFunnelResponse> => {
    const { data } = await apiClient.get<AnalyticsFunnelResponse>('/analytics/funnel', {
      params: { from, to },
    });
    return data;
  },

  getBookingsByDay: async (from: string, to: string): Promise<BookingsByDayResponse> => {
    const { data } = await apiClient.get<BookingsByDayResponse>('/analytics/bookings-by-day', {
      params: { from, to },
    });
    return data;
  },

  getChannels: async (from: string, to: string): Promise<ChannelsAnalyticsResponse> => {
    const { data } = await apiClient.get<ChannelsAnalyticsResponse>('/analytics/channels', {
      params: { from, to },
    });
    return data;
  },

  getStaffAnalytics: async (from: string, to: string): Promise<StaffPerformanceItem[]> => {
    const { data } = await apiClient.get<StaffPerformanceItem[]>('/analytics/staff', {
      params: { from, to },
    });
    return data;
  },
};
