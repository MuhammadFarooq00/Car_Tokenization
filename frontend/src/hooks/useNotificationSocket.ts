import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/api-client';
import { queryKeys } from '@/hooks/api/keys';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('/api', '');

export type IncomingNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
};

interface UseNotificationSocketOptions {
  enabled: boolean;
  onNotification?: (n: IncomingNotification) => void;
}

export function useNotificationSocket({ enabled, onNotification }: UseNotificationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token || socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to notifications');
    });

    socket.on('notification', (notification: IncomingNotification) => {
      // Update the notifications list cache — prepend new notification
      queryClient.setQueryData(
        queryKeys.notifications.list({}),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: [notification, ...(old.data ?? [])],
            total: (old.total ?? 0) + 1,
          };
        },
      );

      // Increment the unread count
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        (old: any) => ({ count: ((old?.count) ?? 0) + 1 }),
      );

      // Call the optional callback (used to show a toast)
      onNotificationRef.current?.(notification);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;
  }, [queryClient]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }
    connect();
    return () => { disconnect(); };
  }, [enabled, connect, disconnect]);
}
