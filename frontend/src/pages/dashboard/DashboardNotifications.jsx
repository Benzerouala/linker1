//frontend/src/pages/dashboard/DashboardNotifications.jsx
"use client"

import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import { getImageUrl } from "../../utils/imageHelper"
import "../../styles/Dashboard.css"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export default function DashboardNotifications() {
  const { user } = useOutletContext()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
        // Mark all as read when page opens
        fetch(`${API_URL}/notifications/read-all`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (senderId, notificationId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/follows/${senderId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok && data.success) {
        if (notificationId) {
          fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { })
        }

        setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
      } else {
        // Si la demande n'existe plus, supprimer la notification
        if (data.message && data.message.includes("non trouvée")) {
          if (notificationId) {
            fetch(`${API_URL}/notifications/${notificationId}/read`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { })
          }
          setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
        } else {
          console.error("Erreur acceptation:", data.message)
        }
      }
    } catch (err) {
      console.error("Error accepting request:", err)
    }
  }

  const handleRejectRequest = async (senderId, notificationId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/follows/${senderId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok && data.success) {
        if (notificationId) {
          fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { })
        }

        setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
      } else {
        // Si la demande n'existe plus, supprimer la notification
        if (data.message && data.message.includes("non trouvée")) {
          if (notificationId) {
            fetch(`${API_URL}/notifications/${notificationId}/read`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { })
          }
          setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
        } else {
          console.error("Erreur rejet:", data.message)
        }
      }
    } catch (err) {
      console.error("Error rejecting request:", err)
    }
  }

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case "new_follower":
        return "s'est abonné à vous"
      case "follow_request":
        return "souhaite s'abonner à vous"
      case "follow_accepted":
        return "a accepté votre demande d'abonnement"
      case "thread_like":
        return "a aimé votre post"
      case "thread_reply":
        return "a répondu à votre post"
      default:
        return "Notification"
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Notifications</h1>
        <p className="dashboard-subtitle">Restez informé de toutes vos activités</p>
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">Aucune notification pour le moment.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-card ${!notif.isRead ? "unread" : ""}`}
            >
              <img
                src={
                  getImageUrl(
                    notif.sender?.profilePicture,
                    "avatar",
                    notif.sender?.username
                  ) || "/placeholder.svg"
                }
                alt={notif.sender?.username}
                className="notification-avatar"
                onError={(e) =>
                  (e.target.src = getImageUrl(null, "avatar", notif.sender?.username))
                }
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
                    {notif.requestStatus === 'en_attente' ? (
                      <>
                        <button
                          className="accept-btn-inline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAcceptRequest(notif.sender._id, notif._id)
                          }}
                        >
                          Accepter
                        </button>
                        <button
                          className="reject-btn-inline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleRejectRequest(notif.sender._id, notif._id)
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    ) : notif.requestStatus === 'accepte' ? (
                      <span className="status-text accepted">Demande acceptée</span>
                    ) : (
                      <span className="status-text processed">Demande traitée</span>
                    )}
                  </div>
                )}

                <span className="notification-time">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
