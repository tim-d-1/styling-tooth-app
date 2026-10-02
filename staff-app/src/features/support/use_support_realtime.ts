import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { SupportMessage } from './support_types';

function mapRealtimeMessage(payload: any): SupportMessage {
  const r = payload.new;
  return {
    id: r.id,
    ticketId: r.ticket_id,
    senderId: r.sender_id,
    senderRole: r.sender_role,
    senderName: r.sender_name,
    senderAvatarUrl: r.sender_avatar_url ?? null,
    text: r.text,
    attachmentUrl: r.attachment_url ?? null,
    createdAt: r.created_at,
  };
}

export function useSupportRealtime(
  ticketId: string | null | undefined,
  onNewMessage: (msg: SupportMessage) => void
) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          callbackRef.current(mapRealtimeMessage(payload));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);
}
