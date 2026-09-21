import { create } from 'zustand';
import type { ConversationStatus, ChannelType } from '@/lib/api/conversations';

export interface InboxStore {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreadCounts: Record<string, number>;
  setUnreadCount: (conversationId: string, count: number) => void;
  setAllUnreadCounts: (counts: Record<string, number>) => void;
  filterStatus: 'ALL' | ConversationStatus;
  setFilterStatus: (status: 'ALL' | ConversationStatus) => void;
  filterChannel: 'ALL' | ChannelType;
  setFilterChannel: (channel: 'ALL' | ChannelType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getTotalUnread: () => number;
  /** Set of conversationIds currently locked by another specialist via WS takeover event */
  takenConversationIds: Set<string>;
  markTaken: (conversationId: string) => void;
  markReleased: (conversationId: string) => void;
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => {
    set({ activeConversationId: id });
    if (id) {
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [id]: 0 },
      }));
    }
  },
  unreadCounts: {},
  setUnreadCount: (conversationId, count) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: count },
    }));
  },
  setAllUnreadCounts: (counts) => set({ unreadCounts: counts }),
  filterStatus: 'ALL',
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  filterChannel: 'ALL',
  setFilterChannel: (filterChannel) => set({ filterChannel }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getTotalUnread: () => {
    const counts = get().unreadCounts;
    return Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
  },
  takenConversationIds: new Set<string>(),
  markTaken: (conversationId) =>
    set((state) => ({
      takenConversationIds: new Set([...state.takenConversationIds, conversationId]),
    })),
  markReleased: (conversationId) =>
    set((state) => {
      const next = new Set(state.takenConversationIds);
      next.delete(conversationId);
      return { takenConversationIds: next };
    }),
}));
