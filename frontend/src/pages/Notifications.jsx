//frontend/src/pages/Notifications.jsx
import { useState, useEffect } from "react";
import NotificationItem from "../components/NotificationItem";
import MobileBottomNavbar from "../components/MobileBottomNavbar";
import "../styles/Notifications.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, mentions

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filter === "unread") params.append("unreadOnly", "true");
      if (filter === "mentions") params.append("type", "mention");
      params.append("limit", "50");

      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors du chargement des notifications");
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data?.notifications || []);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
      // Afficher un message d'erreur à l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif,
          ),
        );
      }
    } catch (error) {
      console.error("Erreur marquage notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true })),
        );
        window.dispatchEvent(
          new CustomEvent("refreshUnreadCount", { detail: { count: 0 } }),
        );
      }
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error);
    }
  };

  const handleDeleteNotification = (notificationId, wasUnread) => {
    setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
    if (wasUnread) {
      window.dispatchEvent(new Event("refreshUnreadCount"));
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <header className="notifications-header">
          <h1 className="page-title">Notifications</h1>

          {/* Mobile : menu déroulant */}
          <div className="notifications-filters-select-wrapper">
            <select
              className="notifications-filters-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filtrer les notifications"
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="mentions">Mentions</option>
            </select>
          </div>

          {/* Desktop : boutons de filtre */}
          <div className="notifications-filters">
            <button
              className={`filter-button ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Toutes
            </button>
            <button
              className={`filter-button ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Non lues
            </button>
            <button
              className={`filter-button ${filter === "mentions" ? "active" : ""}`}
              onClick={() => setFilter("mentions")}
            >
              Mentions
            </button>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              Tout marquer comme lu
            </button>
          )}
        </header>

        <div className="notifications-content">
          {loading ? (
            <div className="notifications-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des notifications...</p>
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
              <p>Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNavbar />
    </div>
  );
}