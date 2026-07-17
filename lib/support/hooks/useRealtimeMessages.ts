'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/support';

/**
 * Loads a conversation's messages once, then keeps them live via a single
 * Supabase Realtime subscription (one INSERT stream per conversation).
 *
 * `basePath` is a plain string ('/api/support/conversations' or
 * '/api/member/support/conversations'), not a callback. Strings compare by
 * value, so passing one as a literal at the call site is safe as a `useEffect`
 * dependency — no `useCallback` wrapping needed at the call site. This is
 * the fix for the original infinite-loop bug: the previous API took a
 * `fetchUrl` function prop, and an inline arrow function is a *new
 * reference* on every render, which meant the effect re-ran every render
 * regardless of whether `conversationId` had actually changed.
 */
export function useRealtimeMessages(conversationId: string | null, basePath: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Holds the latest `load` function so `refetch` can call it without ever
  // needing to change identity itself (avoids exposing an unstable callback
  // to consumers).
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      loadRef.current = () => {};
      return;
    }

    async function load() {
      setLoading(true);
      const res = await fetch(`${basePath}/${conversationId}/messages`);
      const data = await res.json();
      if (!cancelled) {
        setMessages(data.messages ?? []);
        setLoading(false);
      }
    }

    loadRef.current = load;
    load();

    const supabase = createClient();
    // Channel name is unique per conversation, so switching conversations
    // (or two chat windows open at once) never collides on the same topic.
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // conversationId and basePath are both primitives — stable across
    // renders by value, so this effect only reruns when they actually change.
  }, [conversationId, basePath]);

  // Stable identity: calls through the ref, never needs to change itself.
  const refetch = useCallback(() => {
    loadRef.current();
  }, []);

  return { messages, loading, refetch };
}
