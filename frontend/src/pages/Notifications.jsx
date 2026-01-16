import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserData(token);
    fetchNotifications(token);

    // Marquer toutes les notifications comme lues lors de l'accès à la page
    markAllAsReadOnPageLoad(token);
  }, [navigate]);

  const markAllAsReadOnPageLoad = async (token) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Pas besoin de traiter la réponse, c'est juste pour marquer comme lu
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const fetchUserData = async (token) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchNotifications = async (token) => {
    try {
      setLoading(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Récupérer toutes les notifications
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleAcceptRequest = async (followerId) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/follows/${followerId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Marquer la notification comme lue
        const notification = notifications.find(
          (n) => n.type === "follow_request" && n.sender?._id === followerId
        );
        if (notification) {
          markAsRead(notification._id);
        }

        alert("Demande acceptée");
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (followerId) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/follows/${followerId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Marquer la notification comme lue
        const notification = notifications.find(
          (n) => n.type === "follow_request" && n.sender?._id === followerId
        );
        if (notification) {
          markAsRead(notification._id);
        }

        alert("Demande rejetée");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "follow_request":
        return (
          <div className="follow-request-message">
            <span>{`${
              notification.sender?.name || notification.sender?.username
            } souhaite vous suivre`}</span>
            <div className="notification-actions-inline">
              <button
                className="accept-btn-inline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptRequest(notification.sender._id);
                }}
              >
                Accepter
              </button>
              <button
                className="reject-btn-inline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectRequest(notification.sender._id);
                }}
              >
                Refuser
              </button>
            </div>
          </div>
        );
      case "follow_accepted":
        return `${
          notification.sender?.name || notification.sender?.username
        } a accepté votre demande de suivi`;
      case "new_follower":
        return `${
          notification.sender?.name || notification.sender?.username
        } vous suit maintenant`;
      default:
        return "Notification";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
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
      case "follow_accepted":
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="notifications-title">
            <Link to="/" className="back-link">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount}</span>
            )}
          </div>

          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
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
              <p>Vous n'avez pas encore de notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${
                  !notification.isRead ? "unread" : ""
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-message">
                    {getNotificationText(notification)}
                  </div>

                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      }
                    )}
                  </div>
                </div>

                {notification.sender && (
                  <img
                    src={
                      notification.sender.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        notification.sender.username
                      )}&size=40&background=6366f1&color=fff&bold=true`
                    }
                    alt={notification.sender.username}
                    className="notification-avatar"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
