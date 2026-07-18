'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mockMember } from '@/lib/support/mock-member';
import type { Conversation } from '@/types/support';

/**
 * Member-scoped counterpart to useRealtimeConversations (agent dashboard).
 * Loads all of the current member's conversations once, then keeps them
 * live via a single Realtime subscription filtered to their member_id —
 * so an agent closing/archiving a conversation (or the member reopening
 * one) is reflected here the instant it commits, no polling, no refresh.
 *
 * This is what fixes the "member page doesn't see the status change" bug:
 * previously the member chat fetched a conversation once on mount and
 * never subscribed to updates on the conversation row itself (only to new
 * messages). Deriving the selected conversation from this live list means
 * status changes propagate for free.
 */
export function useRealtimeMemberConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch('/api/member/support/conversations');
      const data = await res.json();
      if (!cancelled) {
        setConversations(data.conversations ?? []);
        setLoading(false);
      }
    }

    loadRef.current = load;
    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`member-conversations:${mockMember.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `member_id=eq.${mockMember.id}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // mockMember.id is constant for the lifetime of this demo — safe to
    // omit from deps, matching the pattern in useRealtimeConversations.
  }, []);

  const refetch = useCallback(() => {
    loadRef.current();
  }, []);

  return { conversations, loading, refetch };
}