//frontend/src/pages/Search.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import Sidebar from "../components/Sidebar";
import "../styles/Feed.css";
import "../styles/Search.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

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
        }
      );

      if (response.data.success) {
        // Update the user in the list to reflect the follow status
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id.toString() === userId.toString()
              ? { 
                  ...user, 
                  isFollowing: true, 
                  followStatus: isPrivate ? "en_attente" : "accepte" 
                }
              : user
          )
        );

        // Show success message
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
          { headers }
        ),
        fetch(
          `${API_URL}/threads/search?q=${encodeURIComponent(query)}&limit=10&page=${pageNum}`,
          { headers }
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
        
        // Update pagination info
        if (raw?.pagination) {
          setPagination({
            currentPage: raw.pagination.currentPage,
            totalPages: raw.pagination.totalPages,
            totalItems: raw.pagination.totalThreads
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
    if (!query) return;
    setCurrentPage(1); // Reset page when query changes
    fetchData(1);
  }, [query]);

  return (
    <div className="search-page">
      <Sidebar />
      <main className="search-main">
        <div className="search-container">
          <div className="search-header">
            <h1 className="search-title">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Résultats pour : <span className="search-query">{query}</span>
            </h1>
          </div>

          {loading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Recherche en cours...</p>
            </div>
          )}
          
          {error && (
            <div className={`search-message ${error.includes("succès") || error.includes("envoyée") ? "success" : "error"}`}>
              {error}
            </div>
          )}

          <div className="search-layout">
            {/* ===== USERS SECTION ===== */}
            <section className="search-users-section">
              <div className="section-header">
                <h2 className="section-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Utilisateurs ({users.length})
                </h2>
              </div>

              {!loading && users.length === 0 && !error && (
                <div className="empty-state">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>Aucun utilisateur trouvé pour "{query}"</p>
                </div>
              )}

              <div className="users-grid">
                {users.map((user) => (
                  <div key={user._id} className="user-card">
                    <div className="user-avatar-section">
                      <img
                        src={user.profilePicture || "/placeholder.svg"}
                        alt={user.username}
                        className="user-avatar"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                      <div className="user-status-indicators">
                        {user.isVerified && (
                          <div className="verified-indicator" title="Compte vérifié">
                            ✓
                          </div>
                        )}
                        {user.isPrivate && (
                          <div className="private-indicator" title="Compte privé">
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="user-info-section">
                      <div className="user-header">
                        <Link to={`/profile/${user.username}`} className="user-link">
                          <span className="username">{user.username}</span>
                        </Link>
                      </div>
                      
                      {user.bio && (
                        <p className="user-bio">{user.bio}</p>
                      )}
                      
                      {user.isPrivate && !user.isFollowing && (
                        <div className="private-notice">
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Compte privé
                        </div>
                      )}
                      
                      <div className="user-actions">
                        {!user.isFollowing && (
                          <button
                            className="follow-btn"
                            onClick={() => handleFollow(user._id, user.isPrivate)}
                          >
                            {user.isPrivate ? "Demander à suivre" : "Suivre"}
                          </button>
                        )}
                        {user.isFollowing && user.followStatus === "en_attente" && (
                          <button className="follow-btn requested" disabled>
                            Demande envoyée
                          </button>
                        )}
                        {user.isFollowing && user.followStatus === "accepte" && (
                          <button className="follow-btn following" disabled>
                            Abonné
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== POSTS SECTION ===== */}
            <section className="search-posts-section">
              <div className="section-header">
                <h2 className="section-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Posts ({posts.length})
                </h2>
              </div>

              {!loading && posts.length === 0 && !error && (
                <div className="empty-state">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Aucun post trouvé pour "{query}"</p>
                </div>
              )}

              <div className="posts-feed">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={(id) =>
                      setPosts((prev) => prev.filter((p) => p._id !== id))
                    }
                    onUpdate={(id, data) =>
                      setPosts((prev) =>
                        prev.map((p) =>
                          p._id === id ? { ...p, ...data } : p
                        )
                      )
                    }
                  />
                ))}
                
                {/* Pagination for posts */}
                {posts.length > 0 && (
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
          </div>
        </div>
      </main>
    </div>
  );
}