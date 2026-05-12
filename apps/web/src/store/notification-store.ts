"use client";

import { create } from "zustand";

export interface NotificationItem {
  _id: string;
  type: "referral_joined" | "credit_added" | "purchase_success" | "admin_push";
  title: string;
  message: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[], unreadCount: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(
        0,
        s.notifications.filter((n) => !n.isRead && n._id !== id).length
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 10),
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),
}));
