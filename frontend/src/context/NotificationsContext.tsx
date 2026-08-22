import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const INITIAL: AppNotification[] = [
  {
    id: "n1",
    title: "Daily streak",
    body: "You're on a 5-day streak — keep it going!",
    time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
  },
  {
    id: "n2",
    title: "Wearable sync",
    body: "Health Connect data synced successfully.",
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: "n3",
    title: "Coach tip",
    body: "Try logging protein at breakfast to hit your macro target.",
    time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
  },
];

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState(INITIAL);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => {
        const id = `live-${Date.now()}`;
        const next: AppNotification = {
          id,
          title: "Live update",
          body: "Your vitals were refreshed from connected devices.",
          time: new Date().toISOString(),
          read: false,
        };
        return [next, ...prev].slice(0, 12);
      });
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead, markRead }),
    [notifications, unreadCount, markAllRead, markRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return ctx;
}
