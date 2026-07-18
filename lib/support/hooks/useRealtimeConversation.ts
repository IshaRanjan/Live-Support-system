'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/support';

/**
 * Loads a single conversation once, then keeps its status/fields live via
 * a Supabase Realtime subscription filtered to that row. Used by the
 * member's conversation-detail view so a status change from the agent
 * dashboard (close/archive) — or the member's own Reopen Case action — is
 * reflected immediately without a manual refetch.
 */
export function useRealtimeConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      loadRef.current = () => {};
      return;
    }

    async function load() {
      setLoading(true);
      const res = await fetch(`/api/member/support/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setConversation(data.conversation ?? null);
      }
      if (!cancelled) setLoading(false);
    }

    loadRef.current = load;
    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (!cancelled) setConversation(payload.new as Conversation);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const refetch = useCallback(() => {
    loadRef.current();
  }, []);

  return { conversation, loading, refetch };
}