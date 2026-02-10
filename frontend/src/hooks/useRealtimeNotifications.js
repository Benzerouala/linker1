// frontend/src/hooks/useRealtimeNotifications.js
import { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useToastContext } from "../contexts/ToastContext";
import API_URL from "../utils/api";

export const useRealtimeNotifications = () => {
  const { socket, connected } = useSocket();
  const { success } = useToastContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications initiales
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Écouter les événements Socket.io
  useEffect(() => {
    if (!socket || !connected) return;

    console.log("👂 Listening for real-time notifications...");

    // Nouvelle notification
    socket.on("new_notification", (event) => {
      console.log("📬 New notification received:", event);

      const notification = event.data;
      setNotifications((prev) => [notification, ...prev]);

      const message = getNotificationMessage(notification);
      success(message);

      playNotificationSound();
    });

    // Notification de follow
    socket.on("follow_notification", (event) => {
      console.log("👤 Follow notification received:", event);
      const message = `👤 Quelqu'un vous suit`;
      success(message);
      playNotificationSound();
    });

    // Notification de mention
    socket.on("mention_notification", (event) => {
      console.log("@️ Mention notification received:", event);
      const message = `@️ Vous avez été mentionné`;
      success(message);
      playNotificationSound();
    });

    // Compteur de non-lues
    socket.on("unread_count", (event) => {
      console.log("🔢 Unread count updated:", event.data.count);
      setUnreadCount(event.data.count);
    });

    return () => {
      socket.off("new_notification");
      socket.off("follow_notification");
      socket.off("mention_notification");
      socket.off("unread_count");
    };
  }, [socket, connected]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = () => {
    if (socket && connected) {
      socket.emit("mark_notifications_read");
    }
  };

  const getNotificationMessage = (notification) => {
    const name =
      notification.sender?.name || notification.sender?.username || "Quelqu'un";
    switch (notification.type) {
      case "thread_like":
        return `❤️ ${name} a aimé votre post`;
      case "reply_like":
        return `❤️ ${name} a aimé votre commentaire`;
      case "thread_reply":
        return `💬 ${name} a répondu`;
      case "thread_repost":
        return `🔁 ${name} a reposté`;
      case "follow":
        return `👤 ${name} vous suit`;
      case "mention":
        return `@️ ${name} vous a mentionné`;
      default:
        return `🔔 ${name} - Nouvelle notification`;
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Créer un son plus agréable (bip court)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Son de notification (court et agréable)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Audio notification not supported");
    }
  };

  return {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
