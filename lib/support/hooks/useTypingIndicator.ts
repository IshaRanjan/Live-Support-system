'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SenderRole } from '@/types/support';

const TYPING_TIMEOUT_MS = 3000;

type Role = 'member' | 'agent';

/**
 * Ephemeral typing indicator over Supabase Realtime Broadcast — nothing is
 * ever written to the database. One channel per conversation, named
 * `typing:{conversationId}`, shared by both the member chat and the agent
 * dashboard. `role` is *this* client's role (who is broadcasting); the
 * hook surfaces `otherTyping` for the opposite role only, so a member
 * never sees their own typing echoed back.
 */
export function useTypingIndicator(conversationId: string | null, role: Role) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const sendStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOtherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOtherTyping(false);
    if (sendStopTimerRef.current) clearTimeout(sendStopTimerRef.current);
    if (clearOtherTimerRef.current) clearTimeout(clearOtherTimerRef.current);

    if (!conversationId) {
      channelRef.current = null;
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    function handleTyping(payload: { payload: { role: SenderRole } }) {
      const senderRole = payload.payload?.role;
      const isFromOtherSide = role === 'member' ? senderRole === 'agent' : senderRole === 'member';
      if (!isFromOtherSide) return;

      setOtherTyping(true);
      if (clearOtherTimerRef.current) clearTimeout(clearOtherTimerRef.current);
      clearOtherTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_TIMEOUT_MS);
    }

    function handleStopTyping(payload: { payload: { role: SenderRole } }) {
      const senderRole = payload.payload?.role;
      const isFromOtherSide = role === 'member' ? senderRole === 'agent' : senderRole === 'member';
      if (!isFromOtherSide) return;

      setOtherTyping(false);
      if (clearOtherTimerRef.current) clearTimeout(clearOtherTimerRef.current);
    }

    channel
      .on('broadcast', { event: 'typing' }, handleTyping)
      .on('broadcast', { event: 'stop_typing' }, handleStopTyping)
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (sendStopTimerRef.current) clearTimeout(sendStopTimerRef.current);
      if (clearOtherTimerRef.current) clearTimeout(clearOtherTimerRef.current);
    };
  }, [conversationId, role]);

  // Call on every keystroke. Debounces its own "stop_typing" broadcast so
  // rapid typing doesn't spam the channel — only fires stop after a pause.
  const notifyTyping = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { role } });

    if (sendStopTimerRef.current) clearTimeout(sendStopTimerRef.current);
    sendStopTimerRef.current = setTimeout(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { role } });
    }, TYPING_TIMEOUT_MS);
  }, [role]);

  // Call immediately after sending a message, so the indicator clears on
  // the other side right away instead of waiting out the timeout.
  const notifyStoppedTyping = useCallback(() => {
    if (sendStopTimerRef.current) clearTimeout(sendStopTimerRef.current);
    channelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { role } });
  }, [role]);

  return { otherTyping, notifyTyping, notifyStoppedTyping };
}