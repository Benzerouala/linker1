import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageHelper";
import CreatePost from "./CreatePost";
import TopNavbar from "./TopNavbar";
import "../styles/Sidebar.css";
import "../styles/SidebarNotificationBadge.css";

export default function Sidebar() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          // Compter uniquement les notifications non lues pour le badge
          const unreadNotifications = (data.data || []).filter(
            (n) => !n.isRead
          );
          setNotifications(unreadNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
    fetchNotifications();

    // Écouter les changements de route pour mettre à jour les notifications
    if (location.pathname === "/dashboard/notifications") {
      fetchNotifications();
    }
  }, [location.pathname]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <>
      <aside className="sidebar">
        <TopNavbar />

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
              to="/dashboard/explore"
              className={`sidebar-link ${
                isActive("/dashboard/explore") ? "active" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Rechercher</span>
            </Link>

            <button
              className="sidebar-link sidebar-new-post-link"
              onClick={() => setShowCreatePost(true)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Ajouter post</span>
            </button>

            <Link
              to="/dashboard/notifications"
              className={`sidebar-link ${
                isActive("/dashboard/notifications") ? "active" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="sidebar-notification-badge">
                  {notifications.length}
                </span>
              )}
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
          </nav>

          {/* Create Post Modal */}
          {showCreatePost && (
            <div
              className="create-post-modal-overlay"
              onClick={() => setShowCreatePost(false)}
            >
              <div
                className="create-post-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="create-post-modal-header">
                  <h3>Créer un post</h3>
                  <button
                    className="create-post-modal-close"
                    onClick={() => setShowCreatePost(false)}
                  >
                    ×
                  </button>
                </div>
                <CreatePost onPostCreated={() => setShowCreatePost(false)} />
              </div>
            </div>
          )}

          {/* User menu at the bottom */}
          {user && (
            <div className="sidebar-user-menu">
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
                    to="/dashboard/profile"
                    className="sidebar-dropdown-item"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profil
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="sidebar-dropdown-item"
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
