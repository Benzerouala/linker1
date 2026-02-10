"use client";

import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";
import { useToastContext } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";
import API_URL from "../../utils/api";
import "../../styles/Dashboard.css";

export default function DashboardNotifications() {
  const { user } = useOutletContext();
  const { success, showError } = useToastContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setNotifications(notifications.filter((n) => n._id !== notificationId));
        success("✓ Notification supprimée");
      } else {
        showError("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Erreur de connexion");
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications/clear-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications([]);
        success("✓ Toutes les notifications supprimées");
      } else {
        showError("Erreur lors du nettoyage");
      }
    } catch (error) {
      console.error("Clear all error:", error);
      showError("Erreur de connexion");
    } finally {
      setShowClearConfirm(false);
    }
  };

  const handleConfirmClearAll = () => {
    handleClearAllNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data?.notifications || []);
        // Mark all as read when page opens
        await fetch(`${API_URL}/notifications/read-all`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        window.dispatchEvent(
          new CustomEvent("refreshUnreadCount", { detail: { count: 0 } }),
        );
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (senderId, notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/follows/${senderId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (notificationId) {
          fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }

        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
      } else {
        // Si la demande n'existe plus, supprimer la notification
        if (data.message && data.message.includes("non trouvée")) {
          if (notificationId) {
            fetch(`${API_URL}/notifications/${notificationId}/read`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
          setNotifications((prev) =>
            prev.filter((n) => n._id !== notificationId),
          );
        } else {
          console.error("Erreur acceptation:", data.message);
        }
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (senderId, notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/follows/${senderId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (notificationId) {
          fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }

        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
      } else {
        // Si la demande n'existe plus, supprimer la notification
        if (data.message && data.message.includes("non trouvée")) {
          if (notificationId) {
            fetch(`${API_URL}/notifications/${notificationId}/read`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
          setNotifications((prev) =>
            prev.filter((n) => n._id !== notificationId),
          );
        } else {
          console.error("Erreur rejet:", data.message);
        }
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const handleNotificationNavigate = (notif) => {
    const isFollowNotification = [
      "new_follower",
      "follow_request",
      "follow_accepted",
    ].includes(notif.type);

    if (isFollowNotification && notif.sender?.username) {
      navigate(`/profile/${notif.sender.username}`);
      return;
    }

    const threadId = notif.thread?._id || notif.thread;
    const replyId = notif.reply?._id || notif.reply;

    if (threadId) {
      navigate("/dashboard/posts", {
        state: {
          focusThreadId: threadId,
          focusReplyId: replyId,
          focusType: notif.type,
        },
      });
    }
  };

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case "new_follower":
        return "s'est abonné à vous";
      case "follow_request":
        return "souhaite s'abonner à vous";
      case "follow_accepted":
        return "a accepté votre demande d'abonnement";
      case "thread_like":
        return "a aimé votre post";
      case "reply_like":
        return "a aimé votre commentaire";
      case "thread_reply":
        return "a répondu à votre post";
      default:
        return "Notification";
    }
  };

  const getNotificationCategory = (notif) => {
    if (
      ["new_follower", "follow_request", "follow_accepted"].includes(notif.type)
    ) {
      return "follow";
    }
    if (["thread_like", "like", "reply_like"].includes(notif.type)) {
      return "like";
    }
    if (["thread_reply", "reply"].includes(notif.type)) {
      return "reply";
    }
    if (["mention"].includes(notif.type)) {
      return "mention";
    }
    return "other";
  };

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter(
          (notif) => getNotificationCategory(notif) === activeFilter,
        );

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div className="header-top">
          <div>
            <h1 className="dashboard-title">Notifications</h1>
            <p className="dashboard-subtitle">
              Restez informé de toutes vos activités
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              className="btn-clear-all-notifications"
              onClick={() => setShowClearConfirm(true)}
              title="Supprimer toutes les notifications"
            >
              🗑️ Tout supprimer
            </button>
          )}
        </div>
        <div className="notification-filters">
          <button
            className={`notification-filter-button ${
              activeFilter === "all" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("all")}
          >
            Tout
          </button>
          <button
            className={`notification-filter-button ${
              activeFilter === "follow" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("follow")}
          >
            Abonnements
          </button>
          <button
            className={`notification-filter-button ${
              activeFilter === "like" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("like")}
          >
            J'aime
          </button>
          <button
            className={`notification-filter-button ${
              activeFilter === "reply" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("reply")}
          >
            Commentaires
          </button>
          <button
            className={`notification-filter-button ${
              activeFilter === "mention" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("mention")}
          >
            Mentions
          </button>
          <button
            className={`notification-filter-button ${
              activeFilter === "other" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("other")}
          >
            Autres
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            Aucune notification pour ce filtre.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-card ${!notif.isRead ? "unread" : ""}`}
              onClick={() => handleNotificationNavigate(notif)}
            >
              <img
                src={
                  getImageUrl(
                    notif.sender?.profilePicture,
                    "avatar",
                    notif.sender?.username,
                  ) || "/placeholder.svg"
                }
                alt={notif.sender?.username}
                className="notification-avatar"
                onError={handleImageError}
              />

              <div className="notification-body">
                <p className="notification-text">
                  <span className="notification-username">
                    {notif.sender?.name || notif.sender?.username}
                  </span>{" "}
                  {getNotificationText(notif)}
                </p>

                {notif.type === "follow_request" && notif.sender?._id && (
                  <div className="notification-actions-inline">
                    {notif.requestStatus === "en_attente" ? (
                      <>
                        <button
                          className="accept-btn-inline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAcceptRequest(notif.sender._id, notif._id);
                          }}
                        >
                          Accepter
                        </button>
                        <button
                          className="reject-btn-inline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRejectRequest(notif.sender._id, notif._id);
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    ) : notif.requestStatus === "accepte" ? (
                      <span className="status-text accepted">
                        Demande acceptée
                      </span>
                    ) : (
                      <span className="status-text processed">
                        Demande traitée
                      </span>
                    )}
                  </div>
                )}

                <div className="notification-footer">
                  <span className="notification-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                  <button
                    className="btn-delete-notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notif._id);
                    }}
                    title="Supprimer cette notification"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Supprimer toutes les notifications"
        message="Êtes-vous sûr de vouloir supprimer toutes vos notifications ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}