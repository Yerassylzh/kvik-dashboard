export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
export type LeadStatus = 'NEW' | 'APPOINTMENT_SET' | 'DEAL_WON' | 'DEAL_LOST' | 'QUALIFIED' | 'BOOKED' | 'WON' | 'LOST';
export type MessageRole = 'user' | 'bot' | 'manager';

export interface Channel {
  id: string;
  workspaceId: string;
  type: ChannelType;
  credentials?: Record<string, unknown>;
  active: boolean;
}

export interface Lead {
  id: string;
  workspaceId: string;
  name?: string | null;
  phone?: string | null;
  status: LeadStatus;
  nicheData?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  leadId: string;
  channelId: string;
  status: string;
  createdAt: string;
  lead?: Lead;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}
