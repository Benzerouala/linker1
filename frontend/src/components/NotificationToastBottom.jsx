// Toast de notification en bas qui s'affiche 3 secondes
import { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageHelper";
import "../styles/NotificationToastBottom.css";

export default function NotificationToastBottom({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10);

    // Auto-fermeture après 3 secondes
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Attendre la fin de l'animation
  };

  const getNotificationMessage = () => {
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

  const getNotificationIcon = () => {
    switch (notification.type) {
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

  return (
    <div className={`notification-toast-bottom ${isVisible ? "visible" : ""}`}>
      <div className="toast-bottom-content">
        <div className="toast-bottom-avatar">
          {notification.sender?.profilePicture ? (
            <img
              src={getImageUrl(notification.sender.profilePicture)}
              alt={notification.sender?.username}
            />
          ) : (
            <div className="toast-bottom-avatar-placeholder">
              {(notification.sender?.name ||
                notification.sender?.username ||
                "U")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="toast-bottom-icon-wrapper">{getNotificationIcon()}</div>
        <div className="toast-bottom-message">
          <p>{getNotificationMessage()}</p>
        </div>
      </div>
      <div className="toast-bottom-progress">
        <div className="toast-bottom-progress-bar" />
      </div>
    </div>
  );
}
