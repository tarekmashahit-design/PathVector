import { useEffect, useRef, useState } from 'react';
import { type Alert, initialAlerts, nextQueuedAlert } from '../data/alerts';
import { type Notification, initialNotifications, nextQueuedNotification } from '../data/notifications';

interface LiveEventsState {
  alerts: Alert[];
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

/**
 * Periodically appends a new alert/notification from a canned queue so the
 * app reads as a live system rather than a static mock. Intervals are
 * randomized within a band to avoid a mechanical, perfectly-even cadence.
 */
export function useLiveEvents(): LiveEventsState {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const alertSeq = useRef(0);
  const notifSeq = useRef(0);

  useEffect(() => {
    const alertTimer = setInterval(() => {
      alertSeq.current += 1;
      setAlerts((prev) => [nextQueuedAlert(alertSeq.current), ...prev].slice(0, 40));
    }, 15000 + Math.random() * 4000);

    const notifTimer = setInterval(() => {
      notifSeq.current += 1;
      setNotifications((prev) => [nextQueuedNotification(notifSeq.current), ...prev].slice(0, 40));
    }, 22000 + Math.random() * 8000);

    return () => {
      clearInterval(alertTimer);
      clearInterval(notifTimer);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return { alerts, notifications, unreadCount, markAllRead, markRead };
}
