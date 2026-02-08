//frontend/src/pages/Search.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import Sidebar from "../components/Sidebar";
import MobileBottomNavbar from "../components/MobileBottomNavbar";
import "../styles/Feed.css";
import "../styles/Search.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Search() {
  const [searchParams] = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim();

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [activeFilter, setActiveFilter] = useState("all");

  const handleFollow = async (userId, isPrivate) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté pour vous abonner à un utilisateur");
        return;
      }

      const response = await axios.post(
        `${API_URL}/follows/${userId}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id.toString() === userId.toString()
              ? {
                  ...user,
                  isFollowing: true,
                  followStatus: isPrivate ? "en_attente" : "accepte",
                }
              : user,
          ),
        );

        const message = isPrivate
          ? "Demande d'abonnement envoyée"
          : "Utilisateur abonné avec succès";
        setError(message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'abonnement");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchData = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const [usersRes, postsRes] = await Promise.all([
        fetch(
          `${API_URL}/users/search?q=${encodeURIComponent(query)}&limit=20`,
          { headers },
        ),
        fetch(
          `${API_URL}/threads/search?q=${encodeURIComponent(query)}&limit=10&page=${pageNum}`,
          { headers },
        ),
      ]);

      const usersData = await usersRes.json();
      const postsData = await postsRes.json();

      if (usersData.success) {
        setUsers(usersData.data);
      } else {
        setUsers([]);
      }

      if (postsData.success) {
        const raw = postsData.data;
        setPosts(Array.isArray(raw) ? raw : raw?.threads || []);

        if (raw?.pagination) {
          setPagination({
            currentPage: raw.pagination.currentPage,
            totalPages: raw.pagination.totalPages,
            totalItems: raw.pagination.totalThreads,
          });
        }
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) {
      setUsers([]);
      setPosts([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      setLoading(false);
      return;
    }
    setCurrentPage(1);
    fetchData(1);
  }, [query]);

  const filteredUsers = users;
  const sortedPosts = posts;

  return (
    <div className="search-page">
      <Sidebar />
      <main className="search-main">
        <div className="search-container">
          <div className="search-header">
            <h1 className="search-title">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Résultats pour :{" "}
              <span className="search-query">
                {query ? `"${query}"` : "…"}
              </span>
            </h1>
            <p
              style={{
                color: "#6b7280",
                margin: "1rem 0 0",
                fontSize: "0.95rem",
              }}
            >
              {filteredUsers.length} utilisateur(s) •{" "}
              {pagination.totalItems || sortedPosts.length} post(s)
            </p>
          </div>

          <div className="search-filters-bar">
            <div className="filters-left">
              <button
                className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Tout
              </button>
              <button
                className={`filter-chip ${activeFilter === "users" ? "active" : ""}`}
                onClick={() => setActiveFilter("users")}
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Utilisateurs ({filteredUsers.length})
              </button>
              <button
                className={`filter-chip ${activeFilter === "posts" ? "active" : ""}`}
                onClick={() => setActiveFilter("posts")}
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Posts ({sortedPosts.length})
              </button>
            </div>
          </div>

          {loading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Recherche en cours...</p>
            </div>
          )}

          {error && (
            <div
              className={`search-message ${error.includes("succès") || error.includes("envoyée") ? "success" : "error"}`}
            >
              {error}
            </div>
          )}

          <div
            className={`search-layout ${activeFilter === "posts" ? "posts-only" : activeFilter === "users" ? "users-only" : ""}`}
          >
            {" "}
            {(activeFilter === "all" || activeFilter === "users") && (
              <section className="search-users-section">
                {!loading && filteredUsers.length === 0 && (
                  <div className="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p>Aucun utilisateur trouvé pour "{query}"</p>
                  </div>
                )}

                <div className="users-grid">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="user-card">
                      <div className="user-avatar-section">
                        <img
                          src={
                            user.profilePicture ||
                            `https://ui-avatars.com/api/?name=${user.username}&background=4FD04C&color=fff&size=80`
                          }
                          alt={user.username}
                          className="user-avatar"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=4FD04C&color=fff&size=80`;
                          }}
                        />
                        <div className="user-status-indicators">
                          {user.isVerified && (
                            <div
                              className="verified-indicator"
                              title="Compte vérifié"
                            >
                              ✓
                            </div>
                          )}
                          {user.isPrivate && (
                            <div
                              className="private-indicator"
                              title="Compte privé"
                            >
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="user-info-section">
                        <div className="user-header">
                          <Link
                            to={`/profile/${user.username}`}
                            className="user-link"
                          >
                            <span className="username">@{user.username}</span>
                          </Link>
                          {user.name && (
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "#9ca3af",
                                margin: "0.25rem 0 0",
                              }}
                            >
                              {user.name}
                            </p>
                          )}
                        </div>

                        {user.bio && <p className="user-bio">{user.bio}</p>}

                        {user.isPrivate && !user.isFollowing && (
                          <div className="private-notice">
                            <svg
                              width="12"
                              height="12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            Compte privé
                          </div>
                        )}

                        <div className="user-actions">
                          {!user.isFollowing && (
                            <button
                              className="follow-btn"
                              onClick={() =>
                                handleFollow(user._id, user.isPrivate)
                              }
                            >
                              {user.isPrivate ? "Demander à suivre" : "Suivre"}
                            </button>
                          )}
                          {user.isFollowing &&
                            user.followStatus === "en_attente" && (
                              <button className="follow-btn requested" disabled>
                                ⏳ Demande envoyée
                              </button>
                            )}
                          {user.isFollowing &&
                            user.followStatus === "accepte" && (
                              <button className="follow-btn following" disabled>
                                ✓ Abonné
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {(activeFilter === "all" || activeFilter === "posts") && (
              <section className="search-posts-section">
                <div className="posts-feed">
                  {sortedPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={(id) =>
                        setPosts((prev) => prev.filter((p) => p._id !== id))
                      }
                      onUpdate={(id, data) =>
                        setPosts((prev) =>
                          prev.map((p) =>
                            p._id === id ? { ...p, ...data } : p,
                          ),
                        )
                      }
                    />
                  ))}

                  {sortedPosts.length > 0 && pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      itemsPerPage={10}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <MobileBottomNavbar />
    </div>
  );
}