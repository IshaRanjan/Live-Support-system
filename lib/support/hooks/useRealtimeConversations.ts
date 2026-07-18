'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/support';

/**
 * Loads ALL conversations once and keeps them live via a single Supabase
 * Realtime subscription. Deliberately takes no `status`/`search` arguments:
 * the old version took filter options and was called four separate times
 * on the dashboard (once per status count + once for the visible list),
 * which opened four realtime channels. Fetch once, subscribe once, and let
 * consumers derive filtered views / counts from the one list with
 * `useMemo` — see app/support/dashboard/page.tsx.
 */
export function useRealtimeConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch('/api/support/conversations');
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
      .channel('conversations:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // Empty dependency array is intentional: this subscription is created
    // exactly once for the lifetime of the component and torn down on
    // unmount. There is nothing here that should ever cause a resubscribe.
  }, []);

  const refetch = useCallback(() => {
    loadRef.current();
  }, []);

  return { conversations, loading, refetch };
}