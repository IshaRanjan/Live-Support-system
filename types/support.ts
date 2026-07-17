import type { Database } from './database';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type SupportAgent = Database['public']['Tables']['support_agents']['Row'];

export type ConversationType = Conversation['type'];
export type ConversationStatus = Conversation['status'];
export type SenderRole = Message['sender_role'];
