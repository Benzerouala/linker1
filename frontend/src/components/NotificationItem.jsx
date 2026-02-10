import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationItem.css";
import API_URL from "../utils/api";

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.stopPropagation();

    try {
      // Marquer comme lu
      if (!notification.isRead) {
        await handleMarkAsRead();
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
      console.error("Erreur lors du traitement de la notification:", error);
    }
  };

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/notifications/${notification._id}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        onMarkAsRead?.(notification._id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors du marquage comme lu");
      }
    } catch (error) {
      console.error("Erreur marquage notification:", error);
      throw error; // Propager pour une gestion plus haut niveau si nécessaire
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications/${notification._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        onDelete?.(notification._id, !notification.isRead);
      }
    } catch (error) {
      console.error("Erreur suppression notification:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "follow":
        return "👤";
      case "like":
      case "thread_like":
      case "reply_like":
        return "❤️";
      case "reply":
      case "thread_reply":
        return "💬";
      case "mention":
        return "🎯";
      default:
        return "🔔";
    }
  };

  const getNotificationMessage = () => {
    const senderName =
      notification.sender?.name || notification.sender?.username || "Quelqu'un";
    switch (notification.type) {
      case "new_follower":
        return `${senderName} s'est abonné à vous`;
      case "follow_request":
        return `${senderName} souhaite s'abonner à vous`;
      case "follow_accepted":
        return `${senderName} a accepté votre demande d'abonnement`;
      case "thread_like":
        return `${senderName} a aimé votre post`;
      case "reply_like":
        return `${senderName} a aimé votre commentaire`;
      case "thread_reply":
        return `${senderName} a répondu à votre post`;
      case "thread_repost":
        return `${senderName} a republié votre post`;
      case "mention":
        return `${senderName} vous a mentionné`;
      default:
        return "Nouvelle notification";
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return notificationDate.toLocaleDateString("fr-FR");
  };

  return (
    <div
      className={`notification-item ${notification.isRead ? "read" : "unread"}`}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <div className="notification-icon">{getNotificationIcon()}</div>
      <div className="notification-content">
        <p className="notification-message">{getNotificationMessage()}</p>
        <p className="notification-time">{formatTime(notification.createdAt)}</p>
      </div>
      <button
        className="notification-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={isDeleting}
        title="Supprimer"
      >
        ✕
      </button>
    </div>
  );
}