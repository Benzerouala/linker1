import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getImageUrl } from "../utils/imageHelper";
import { useSocket } from "../contexts/SocketContext"; // ✅ Import
import "../styles/Sidebar.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Sidebar() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // ✅ Hook Socket.io
  const { socket, connected } = useSocket();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // ✅ Charger le compteur une seule fois au montage
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // ✅ Connexion Socket : synchroniser le badge puis écouter les mises à jour (style Facebook)
  useEffect(() => {
    if (!socket || !connected) return;

    // Dès la connexion, récupérer le bon compteur (onglet ouvert après la notif, etc.)
    fetchUnreadCount();

    socket.on("new_notification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("unread_count", (event) => {
      const count = event?.data?.count;
      if (typeof count === "number") setUnreadCount(count);
    });

    return () => {
      socket.off("new_notification");
      socket.off("unread_count");
    };
  }, [socket, connected]);

  // ✅ Récupérer le compteur une seule fois (pas de polling)
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // ✅ Une seule requête avec le bon endpoint
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error("Erreur compteur notifications:", error);
    }
  };

  useEffect(() => {
    const handleRefresh = (event) => {
      if (typeof event?.detail?.count === "number") {
        setUnreadCount(event.detail.count);
        return;
      }
      fetchUnreadCount();
    };

    window.addEventListener("refreshUnreadCount", handleRefresh);
    return () => {
      window.removeEventListener("refreshUnreadCount", handleRefresh);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.dispatchEvent(new CustomEvent("auth-change"));
    window.location.href = "/";
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Ouvrir la sidebar de notifications
  const handleNotificationsClick = () => {
    window.dispatchEvent(new Event("openNotificationsSidebar"));
  };

  if (!token) {
    return null;
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <Link
              to="/dashboard/posts"
              className={`sidebar-link ${
                isActive("/dashboard/posts") ? "active" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Accueil</span>
            </Link>

            <Link
              to="/dashboard/profile"
              className={`sidebar-link ${
                isActive("/dashboard/profile") ? "active" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Profil</span>
            </Link>

            <Link
              to="/dashboard/notifications"
              className={`sidebar-link ${
                isActive("/dashboard/notifications") ? "active" : ""
              }`}
            >
              <span className="sidebar-link-icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="sidebar-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span>Notifications</span>
            </Link>
          </nav>

          {/* User menu at the bottom */}
          {user && (
            <div className="sidebar-user-menu" ref={dropdownRef}>
              <button className="sidebar-user-trigger" onClick={toggleDropdown}>
                <img
                  src={
                    getImageUrl(user.profilePicture, "avatar", user.username) ||
                    "/placeholder.svg"
                  }
                  alt={user.username}
                  className="sidebar-avatar"
                  onError={(e) => {
                    e.target.src = getImageUrl(null, "avatar", user.username);
                  }}
                />
                <div className="sidebar-user-text">
                  <span className="sidebar-username">
                    {user.name || user.username}
                  </span>
                  <span className="sidebar-user-handle">@{user.username}</span>
                </div>
                <svg
                  className={`sidebar-dropdown-arrow ${
                    isDropdownOpen ? "open" : ""
                  }`}
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="sidebar-dropdown-menu">
                  <Link
                    to="/dashboard/settings"
                    className="sidebar-dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Paramètres
                  </Link>
                  <div className="sidebar-dropdown-divider"></div>
                  <button
                    className="sidebar-dropdown-item sidebar-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
