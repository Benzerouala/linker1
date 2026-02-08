import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext"; // ✅ Import du context
import "../styles/NotificationsSidebarRight.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NotificationsSidebarRight() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Ne pas afficher le panneau sur la page Notifications (éviter la redondance)
  const isNotificationsPage = location.pathname === "/dashboard/notifications" || location.pathname === "/notifications";

  // ✅ Hook Socket.io
  const { socket, connected } = useSocket();

  // Ouvrir le panneau quand on clique sur "Notifications" dans la sidebar gauche
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("openNotificationsSidebar", open);
    return () => window.removeEventListener("openNotificationsSidebar", open);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ Écouter les notifications en temps réel via Socket.io
  useEffect(() => {
    if (!socket || !connected) return;

    console.log(
      "👂 NotificationsSidebar: Listening for real-time notifications...",
    );

    // Nouvelle notification reçue
    socket.on("new_notification", (event) => {
      console.log("📬 NotificationsSidebar: New notification received:", event);

      const notification = event.data;

      // Ajouter la notification en haut de la liste (si non lue)
      if (!notification.isRead) {
        setNotifications((prev) => [notification, ...prev]);

        // Animation + son (optionnel)
        playNotificationSound();
      }
    });

    // Compteur de notifications non lues mis à jour
    socket.on("unread_count", (event) => {
      console.log(
        "🔢 NotificationsSidebar: Unread count updated:",
        event.data.count,
      );
      // Vous pouvez utiliser ce compteur si nécessaire
    });

    // Cleanup
    return () => {
      socket.off("new_notification");
      socket.off("unread_count");
    };
  }, [socket, connected]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur fetch");

      const data = await response.json();
      if (data.success) {
        // Filtrer uniquement les notifications non lues
        const unreadNotifications = (
          data.data.notifications ||
          data.data ||
          []
        ).filter((n) => !n.isRead);
        setNotifications(unreadNotifications);
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications([]);
      window.dispatchEvent(
        new CustomEvent("refreshUnreadCount", { detail: { count: 0 } }),
      );
    } catch (error) {
      console.error("Erreur marquer tout lu:", error);
    }
  };

  // Son de notification
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Could not play sound:", e);
    }
  };

  const categoryConfig = [
    {
      key: "follow_request",
      label: "🧾 Demandes",
      types: ["follow_request"],
    },
    {
      key: "follow_accepted",
      label: "✅ Acceptées",
      types: ["follow_accepted"],
    },
    {
      key: "follow",
      label: "👤 Abonnements",
      types: ["follow", "new_follower"],
    },
    {
      key: "like",
      label: "❤️ J'aime",
      types: ["like", "thread_like", "reply_like"],
    },
    {
      key: "reply",
      label: "💬 Commentaires",
      types: ["reply", "thread_reply"],
    },
    {
      key: "mention",
      label: "🏷️ Tags",
      types: ["mention"],
    },
    {
      key: "repost",
      label: "🔁 Reposts",
      types: ["thread_repost"],
    },
    {
      key: "other",
      label: "🔔 Autres",
      types: [],
    },
  ];

  // Catégoriser les notifications
  const categorizeNotifications = () => {
    const categories = categoryConfig.reduce((acc, category) => {
      acc[category.key] = [];
      return acc;
    }, {});

    notifications.forEach((n) => {
      const match = categoryConfig.find(
        (category) =>
          category.types.length > 0 && category.types.includes(n.type),
      );
      if (match) {
        categories[match.key].push(n);
      } else {
        categories.other.push(n);
      }
    });

    return categories;
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem("token");

      // Marquer comme lu
      if (!notification.isRead) {
        await fetch(`${API_URL}/notifications/${notification._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Retirer de la liste (puisqu'on affiche seulement les non lues)
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notification._id),
        );
      }

      const isFollowNotification = [
        "new_follower",
        "follow_request",
        "follow_accepted",
      ].includes(notification.type);

      if (isFollowNotification && notification.sender?.username) {
        navigate(`/profile/${notification.sender.username}`);
        return;
      }

      const threadId = notification.thread?._id || notification.thread;
      const replyId = notification.reply?._id || notification.reply;

      if (threadId) {
        navigate("/dashboard/posts", {
          state: {
            focusThreadId: threadId,
            focusReplyId: replyId,
            focusType: notification.type,
          },
        });
      }
    } catch (error) {
      console.error("Erreur redirection:", error);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMins = Math.floor((now - notificationDate) / 60000);
    const diffHours = Math.floor((now - notificationDate) / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return notificationDate.toLocaleDateString("fr-FR");
  };

  const getNotificationIcon = (type) => {
    const icons = {
      follow: "👤",
      like: "❤️",
      reply: "💬",
      mention: "🎯",
      thread_reply: "💬",
      thread_like: "❤️",
      reply_like: "❤️",
      thread_repost: "🔁",
    };
    return icons[type] || "🔔";
  };

  const unreadCount = notifications.length;

  const categories = categorizeNotifications();

  const getCategoryMessage = (type, username) => {
    const messages = {
      reply: "a commenté",
      thread_reply: "a commenté",
      follow: "s'est abonné",
      new_follower: "s'est abonné",
      follow_request: "souhaite s'abonner",
      like: "a aimé",
      thread_like: "a aimé",
      reply_like: "a aimé",
      thread_repost: "a reposté",
      mention: "vous a mentionné",
    };
    return messages[type] || "vous a notifié";
  };

  const renderCategorySection = (categoryKey, items) => {
    if (items.length === 0) return null;

    const isExpanded = expandedCategory === categoryKey;
    const label =
      categoryConfig.find((category) => category.key === categoryKey)?.label ||
      "🔔 Autres";

    return (
      <div
        key={categoryKey}
        className={`notification-category ${
          items.length === 0 ? "empty" : ""
        }`}
      >
        <button
          className="category-header"
          onClick={() =>
            items.length === 0
              ? null
              : setExpandedCategory(isExpanded ? null : categoryKey)
          }
          disabled={items.length === 0}
        >
          <span className="category-title">{label}</span>
          <span className="category-count">{items.length}</span>
          <svg
            className={`category-arrow ${isExpanded ? "expanded" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
        {isExpanded && (
          <div className="category-items">
            {items.map((notification) => (
              <div
                key={notification._id}
                className="notification-item-right unread"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-right">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content-right">
                  <p className="notification-user-name">
                    <strong>
                      {notification.fromUser?.username ||
                        notification.sender?.username ||
                        "Utilisateur"}
                    </strong>
                  </p>
                  <p className="notification-action">
                    {getCategoryMessage(
                      notification.type,
                      notification.fromUser?.username ||
                        notification.sender?.username,
                    )}
                  </p>
                  <span className="notification-time-right">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                <div className="unread-dot"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isNotificationsPage) return null;

  return (
    <>
      <div
        className={`notifications-sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside className={`notifications-sidebar-right ${isOpen ? "open" : ""}`}>
        <div className="right-sidebar-header">
          <h3>Notifications</h3>
          <div className="header-info">
            <div
              className={`connection-status ${connected ? "connected" : "disconnected"}`}
              title={connected ? "Connecté en temps réel" : "Déconnecté"}
            >
              {connected ? "🟢" : "🔴"}
            </div>
            <button
              type="button"
              className="notifications-sidebar-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer les notifications"
            >
              ✕
            </button>
          </div>
        </div>

      <div className="right-sidebar-content">
        {loading ? (
          <div className="sidebar-loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="notifications-categories">
            {categoryConfig.map((category) =>
              renderCategorySection(category.key, categories[category.key]),
            )}
          </div>
        )}
      </div>

      <div className="right-sidebar-footer">
        <button
          className="see-all-btn"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Marquer tout comme lu
        </button>
      </div>
    </aside>
    </>
  );
}
