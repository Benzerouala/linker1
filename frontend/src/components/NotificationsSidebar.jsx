import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";
import "../styles/NotificationsSidebar.css";
import API_URL from "../utils/api";

export default function NotificationsSidebar({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialiser Socket.IO
    const initSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        const newSocket = io(API_URL.replace("/api", ""), {
          auth: { token },
        });

        newSocket.on("notification", (notification) => {
          setNotifications((prev) => {
            if (prev.find((n) => n._id === notification._id)) {
              return prev;
            }
            if (!notification.isRead) {
              return [notification, ...prev];
            }
            return prev;
          });
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("Erreur initialisation Socket.IO:", error);
      }
    };

    initSocket();
    fetchNotifications();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    } catch (error) {
      console.error("Erreur marquage notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(
        new CustomEvent("refreshUnreadCount", { detail: { count: 0 } }),
      );
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);

    const isFollowNotification = [
      "new_follower",
      "follow_request",
      "follow_accepted",
    ].includes(notification.type);

    if (isFollowNotification && notification.sender?.username) {
      onClose();
      navigate(`/profile/${notification.sender.username}`);
      return;
    }

    const threadId = notification.thread?._id || notification.thread;
    const replyId = notification.reply?._id || notification.reply;

    if (threadId) {
      onClose();
      navigate("/dashboard/posts", {
        state: {
          focusThreadId: threadId,
          focusReplyId: replyId,
          focusType: notification.type,
        },
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "thread_like":
      case "reply_like":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        );
      case "thread_reply":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        );
      case "thread_repost":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "new_follower":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "follow_request":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      case "mention":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
      default:
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  const getNotificationText = (notification) => {
    const senderName =
      notification.sender?.name || notification.sender?.username || "Quelqu'un";
    switch (notification.type) {
      case "thread_like":
        return `${senderName} a aimé votre publication`;
      case "reply_like":
        return `${senderName} a aimé votre commentaire`;
      case "thread_reply":
        return `${senderName} a commenté votre publication`;
      case "thread_repost":
        return `${senderName} a republié votre publication`;
      case "new_follower":
        return `${senderName} vous suit maintenant`;
      case "follow_request":
        return `${senderName} souhaite vous suivre`;
      case "follow_accepted":
        return `${senderName} a accepté votre demande`;
      case "mention":
        return `${senderName} vous a mentionné`;
      default:
        return "Nouvelle notification";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notifications-sidebar-overlay" onClick={onClose} />
      <div className="notifications-sidebar">
        <div className="notifications-sidebar-header">
          <h2 className="notifications-sidebar-title">Notifications</h2>
          {notifications.some((n) => !n.isRead) && (
            <button onClick={markAllAsRead} className="mark-all-read-btn">
              Tout marquer comme lu
            </button>
          )}
          <button onClick={onClose} className="notifications-sidebar-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="notifications-sidebar-content">
          {loading ? (
            <div className="notifications-loading">
              <div className="loading-spinner-small"></div>
              <p>Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3>Aucune notification</h3>
              <p>Toutes vos notifications sont à jour</p>
            </div>
          ) : (
            <div className="notifications-list-sidebar">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item-sidebar ${
                    !notification.isRead ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-avatar-sidebar">
                    {notification.sender?.profilePicture ? (
                      <img
                        src={getImageUrl(notification.sender.profilePicture)}
                        alt={notification.sender?.username}
                      />
                    ) : (
                      <div className="notification-avatar-placeholder">
                        {(notification.sender?.name ||
                          notification.sender?.username ||
                          "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="notification-icon-sidebar">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content-sidebar">
                    <p className="notification-text-sidebar">
                      {getNotificationText(notification)}
                    </p>
                    <span className="notification-time-sidebar">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && <div className="notification-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
