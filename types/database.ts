export type ConversationType = 'member_support' | 'visitor_support';
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type SenderRole = 'member' | 'visitor' | 'agent';

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          type: ConversationType;
          status: ConversationStatus;
          member_id: string | null;
          member_name: string | null;
          member_email: string | null;
          visitor_name: string | null;
          visitor_email: string | null;
          visitor_session_id: string | null;
          assigned_agent_id: string | null;
          subject: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          archived_at: string | null;
          has_been_reopened: boolean;
        };
        Insert: Partial<Database['public']['Tables']['conversations']['Row']>;
        Update: Partial<Database['public']['Tables']['conversations']['Row']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_role: SenderRole;
          sender_id: string | null;
          sender_name: string | null;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['messages']['Row']>;
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
      };
      support_agents: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['support_agents']['Row']>;
        Update: Partial<Database['public']['Tables']['support_agents']['Row']>;
      };
    };
  };
}
