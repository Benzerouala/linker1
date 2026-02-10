"use client"

import { useState, useEffect } from "react"
import { useOutletContext, Link } from "react-router-dom"
import { getImageUrl } from "../../utils/imageHelper"
import PostCard from "../../components/PostCard"
import Pagination from "../../components/Pagination"
import "../../styles/DashboardExplore.css"
import API_URL from "../../utils/api"

export default function DashboardExplore() {
  const { user } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  })

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setUsers([])
      setPosts([])
      setError("")
      setCurrentPage(1)
      return
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 when searching
      fetchSearchResults(q, 1)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    fetchSearchResults(searchQuery.trim(), newPage)
  }

  const fetchSearchResults = async (q, page = 1) => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem("token")

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const [usersRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/users/search?q=${encodeURIComponent(q)}&limit=20`, { headers }),
        fetch(`${API_URL}/threads/search?q=${encodeURIComponent(q)}&limit=10&page=${page}`, { headers }),
      ])

      const usersData = await usersRes.json()
      const postsData = await postsRes.json()

      if (usersRes.ok && usersData.success) {
        setUsers(usersData.data || [])
      } else {
        setUsers([])
      }

      if (postsRes.ok && postsData.success) {
        const raw = postsData.data
        if (page === 1) {
          setPosts(Array.isArray(raw) ? raw : raw?.threads || [])
        } else {
          // For traditional pagination, replace posts
          setPosts(Array.isArray(raw) ? raw : raw?.threads || [])
        }
        
        // Update pagination info
        if (raw?.pagination) {
          setPagination({
            currentPage: raw.pagination.currentPage,
            totalPages: raw.pagination.totalPages,
            totalItems: raw.pagination.totalThreads
          })
        }
      } else {
        setPosts([])
      }

      if ((!usersRes.ok && usersData?.message) || (!postsRes.ok && postsData?.message)) {
        setError(usersData?.message || postsData?.message || "Erreur lors de la recherche")
      }
    } catch (err) {
      setError("Impossible de contacter le serveur")
      console.error("Error searching:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = currentStatus ? `${API_URL}/follows/${userId}/unfollow` : `${API_URL}/follows/${userId}/follow`
      const method = currentStatus ? "DELETE" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok && data.success) {
        // Mettre à jour l'état local
        setUsers((prev) =>
          prev.map((u) => {
            if (u._id === userId || u.id === userId) {
              return {
                ...u,
                isFollowing: !currentStatus,
                followStatus: currentStatus ? null : data.data?.status || "accepte",
              }
            }
            return u
          }),
        )
      }
    } catch (err) {
      console.error("Error following/unfollowing user:", err)
    }
  }

  const getFollowButtonText = (userItem) => {
    if (userItem.isFollowing) {
      if (userItem.followStatus === "en_attente") {
        return "En attente"
      }
      return "Abonné"
    }
    return "S'abonner"
  }

  const getFollowButtonClass = (userItem) => {
    if (userItem.isFollowing) {
      if (userItem.followStatus === "en_attente") {
        return "btn-requested"
      }
      return "btn-followed"
    }
    return "btn-follow"
  }

  return (
    <div className="dashboard-search-page">
      <div className="dashboard-search-header">
        <h1>Rechercher</h1>
      </div>

      <div className="dashboard-search-box">
        <div className="dashboard-search-input-wrapper">
          <svg className="dashboard-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Rechercher des personnes ou des posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard-search-input"
          />
        </div>

        <div className="dashboard-search-tabs">
          <button
            type="button"
            className={`dashboard-search-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Utilisateurs
          </button>
          <button
            type="button"
            className={`dashboard-search-tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
        </div>

        {error && <div className="dashboard-search-message error">{error}</div>}

        {loading ? (
          <div className="dashboard-search-loading">Chargement...</div>
        ) : activeTab === "users" ? (
          <div className="dashboard-search-results">
            {users.map((userItem) => {
              const userId = userItem._id || userItem.id
              const isCurrentUser = userId?.toString() === (user?.id || user?._id)?.toString()

              return (
                <div key={userId} className="dashboard-user-row">
                  <div className="dashboard-user-left">
                    <img
                      src={getImageUrl(userItem.profilePicture, "avatar", userItem.username) || "/placeholder.svg"}
                      alt={userItem.username}
                      className="dashboard-user-avatar"
                      onError={(e) => (e.target.src = getImageUrl(null, "avatar", userItem.username))}
                    />
                    <div className="dashboard-user-meta">
                      <Link to={`/profile/${userItem.username}`} className="dashboard-user-name">
                        {userItem.name || userItem.username}
                        {userItem.isVerified && " ✓"}
                      </Link>
                      <div className="dashboard-user-username">@{userItem.username}</div>
                      {userItem.bio && <div className="dashboard-user-bio">{userItem.bio}</div>}
                    </div>
                  </div>

                  {!isCurrentUser && (
                    <button
                      className={`dashboard-follow-btn ${getFollowButtonClass(userItem)}`}
                      onClick={() => handleFollow(userId, userItem.isFollowing)}
                      disabled={userItem.isFollowing && userItem.followStatus === "en_attente"}
                    >
                      {userItem.isFollowing && userItem.followStatus === "en_attente" ? "Demande envoyée" : getFollowButtonText(userItem)}
                    </button>
                  )}
                </div>
              )
            })}

            {!loading && searchQuery.trim() && users.length === 0 && (
              <div className="dashboard-search-empty">Aucun utilisateur trouvé</div>
            )}
          </div>
        ) : (
          <div className="dashboard-search-results">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUser={user} />
            ))}

            {!loading && searchQuery.trim() && posts.length === 0 && (
              <div className="dashboard-search-empty">Aucun post trouvé</div>
            )}

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
        )}

        {searchQuery.trim() && (
          <div className="dashboard-search-footer">
            <Link to={`/search?q=${encodeURIComponent(searchQuery)}`} className="dashboard-search-all">
              Voir tous les résultats
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
