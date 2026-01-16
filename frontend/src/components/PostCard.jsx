"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getImageUrl } from "../utils/imageHelper"
import "../styles/PostCard.css"
import "../styles/PostCardFollow.css"

const PostCard = ({ post, onDelete, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editMediaFile, setEditMediaFile] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState("")
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFollowing, setIsFollowing] = useState(post.author?.isFollowing || false)
  const [followLoading, setFollowLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  // Debug: Vérifier l'initialisation
  console.log("PostCard initialized:", {
    postId: post._id,
    initialIsLiked: post.isLiked,
    initialLikesCount: post.likesCount,
    currentIsLiked: isLiked,
    currentLikesCount: likesCount
  });

  // Mettre à jour l'état quand les props changent
  useEffect(() => {
    console.log("Post props updated:", {
      postId: post._id,
      newIsLiked: post.isLiked,
      newLikesCount: post.likesCount
    });

    // Forcer la mise à jour de l'état local avec les nouvelles props
    setIsLiked(post.isLiked || false)
    setLikesCount(post.likesCount || 0)
  }, [post.isLiked, post.likesCount, post._id])

  // Effet pour synchroniser l'état local quand le post est mis à jour par onUpdate
  useEffect(() => {
    // Si les props du post changent (par exemple après un like), mettre à jour l'état local
    if (post.isLiked !== undefined && post.likesCount !== undefined) {
      setIsLiked(post.isLiked)
      setLikesCount(post.likesCount)
    }
  }, [post.isLiked, post.likesCount])

  // Récupérer l'ID utilisateur depuis localStorage directement
  const currentUserId = localStorage.getItem("userId")
  const isAuthor = currentUserId === post.author?._id?.toString()

  // Créer un avatar par défaut avec les initiales ou utiliser placeholder
  const getCurrentUserAvatar = () => {
    // Utiliser un avatar par défaut plus élégant
    // On pourrait créer un avatar avec initiales plus tard si besoin
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%233B82F6'/%3E%3Ctext x='20' y='20' text-anchor='middle' dy='.3em' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3EYOU%3C/text%3E%3C/svg%3E"
  }

  /* ================= UTILS ================= */

  const formatDate = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`
    return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  const getMediaUrl = () => {
    if (!post.media) return null
    const path = typeof post.media === "string" ? post.media : post.media?.url
    if (!path) return null

    // Si c'est une URL externe (commence par http), la retourner directement
    if (path.startsWith('http')) {
      return path
    }

    // Si c'est un fichier local, construire l'URL
    const BASE = API_URL.replace("/api", "")
    return `${BASE}${path.startsWith("/") ? path : `/${path}`}`
  }

  const getMediaType = () => {
    const url = typeof post.media === "string" ? post.media : post.media?.url
    if (!url) return null
    if (url.match(/\.(mp4|webm|ogg)$/i)) return "video"
    if (url.match(/youtube|youtu\.be|vimeo/i)) return "video"
    return "image"
  }

  const isYouTubeVideo = () => {
    const url = getMediaUrl()
    return url && url.match(/youtube|youtu\.be/i)
  }

  const getYouTubeEmbedUrl = () => {
    const url = getMediaUrl()
    if (!url) return null

    // Extraire l'ID YouTube de différentes formats d'URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  /* ================= ACTIONS ================= */

  const handleLikeClick = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    console.log("Like clicked - Current state:", { isLiked, likesCount, postId: post._id }); // Debug

    const endpoint = isLiked ? "unlike" : "like"
    const res = await fetch(`${API_URL}/threads/${post._id}/${endpoint}`, {
      method: isLiked ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    console.log("Like API response:", data); // Debug

    if (data.success) {
      const newIsLiked = !isLiked
      const newLikesCount = data.data.likesCount || (isLiked ? likesCount - 1 : likesCount + 1)

      console.log("Updating like state:", {
        oldIsLiked: isLiked,
        newIsLiked,
        oldLikesCount: likesCount,
        newLikesCount,
        apiLikesCount: data.data.likesCount
      }); // Debug

      // Mettre à jour l'état local immédiatement
      setIsLiked(newIsLiked)
      setLikesCount(newLikesCount)

      // Mettre à jour les données du post dans le composant parent
      onUpdate?.(post._id, {
        ...post,
        isLiked: newIsLiked,
        likesCount: newLikesCount
      })
    } else {
      console.error("Like API failed:", data); // Debug
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce post ?")) return
    setIsDeleting(true)

    try {
      const response = await fetch(`${API_URL}/threads/${post._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      const data = await response.json()
      if (data.success) {
        onDelete?.(post._id)
      } else {
        alert(data.message || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Erreur de connexion au serveur")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(post.content)
  }

  useEffect(() => {
    if (showReplies && post._id) {
      fetchReplies()
    }
  }, [showReplies, post._id])

  const fetchReplies = async () => {
    setLoadingReplies(true)
    try {
      const response = await fetch(`${API_URL}/replies/${post._id}`)
      const data = await response.json()
      if (data.success) {
        setReplies(data.data)
      }
    } catch (error) {
      console.error("Error fetching replies:", error)
    } finally {
      setLoadingReplies(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editContent.trim()) return

    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append("content", editContent)
      if (editMediaFile) {
        formData.append("media", editMediaFile)
      }

      const response = await fetch(`${API_URL}/threads/${post._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setIsEditing(false)
        onUpdate?.(post._id, data.data)
      } else {
        alert(data.message || "Erreur lors de la modification")
      }
    } catch (error) {
      console.error("Update error:", error)
      alert("Erreur de connexion au serveur")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token || !newReply.trim()) return

    try {
      setReplyLoading(true)
      const response = await fetch(`${API_URL}/replies/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newReply }),
      })

      const data = await response.json()
      if (data.success) {
        setReplies([data.data, ...replies])
        setNewReply("")
        onUpdate?.(post._id, { ...post, repliesCount: (post.repliesCount || 0) + 1 })
      }
    } catch (error) {
      console.error("Reply error:", error)
    } finally {
      setReplyLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId || isAuthor) return

    try {
      setFollowLoading(true)
      const token = localStorage.getItem("token")

      const endpoint = isFollowing ? "unfollow" : "follow"
      const method = isFollowing ? "DELETE" : "POST"

      const response = await fetch(`${API_URL}/follows/${post.author._id}/${endpoint}`, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const newIsFollowing = !isFollowing
        setIsFollowing(newIsFollowing)

        let message = ""
        if (newIsFollowing) {
          message = post.author.isPrivate
            ? "Demande d'abonnement envoyée !"
            : "Vous suivez maintenant cet utilisateur !"
        } else {
          message = "Vous ne suivez plus cet utilisateur."
        }

        // Mettre à jour le post pour refléter le changement
        onUpdate?.(post._id, {
          ...post,
          author: {
            ...post.author,
            isFollowing: newIsFollowing
          }
        })

        // alert(message) // Optionnel : on peut retirer l'alerte pour une UX plus fluide
      } else {
        alert(data.message || "Erreur lors de l'action")
      }
    } catch (err) {
      console.error("Error following user:", err)
      alert("Erreur de connexion")
    } finally {
      setFollowLoading(false)
    }
  }

  /* ================= RENDER ================= */

  const author = post.author || {}
  const mediaUrl = getMediaUrl()
  const mediaType = getMediaType()

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${author.username}`} className="post-author">
          <img
            src={getImageUrl(author.profilePicture, "avatar", author.username) || "/placeholder.svg"}
            className="post-avatar"
            alt={author.username}
          />
          <div>
            <strong>{author.name}</strong>
            <div className="post-author-username">@{author.username}</div>
          </div>
        </Link>

        <div className="post-header-actions">
          {/* Bouton S'abonner / Se désabonner */}
          {currentUserId && !isAuthor && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
            >
              {followLoading ? "Chargement..." : (isFollowing ? "Se désabonner" : "S'abonner")}
            </button>
          )}

          <span className="post-time">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="post-edit-form">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="post-edit-textarea"
            rows="3"
            autoFocus
          />
          <div className="post-edit-media">
            <label htmlFor={`edit-media-${post._id}`} className="edit-media-label">
              Changer l'image/vidéo
            </label>
            <input
              id={`edit-media-${post._id}`}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setEditMediaFile(e.target.files[0])}
              className="hidden"
            />
            {editMediaFile && <span className="file-name">{editMediaFile.name}</span>}
          </div>
          <div className="post-edit-actions">
            <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" disabled={isUpdating} className="save-btn">
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="post-content">{post.content}</div>

          {mediaUrl && (
            <div className="post-media">
              {isYouTubeVideo() ? (
                <div className="youtube-embed-container">
                  <iframe
                    src={getYouTubeEmbedUrl()}
                    className="youtube-embed"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video"
                  />
                </div>
              ) : mediaType === "image" ? (
                <img src={mediaUrl || "/placeholder.svg"} className="post-media-img" alt="Post content" />
              ) : (
                <video src={mediaUrl} controls className="post-media-video" />
              )}
            </div>
          )}
        </>
      )}

      <div className="post-actions">
        <button onClick={handleLikeClick} className={`action-btn ${isLiked ? 'liked' : ''}`}>
          <svg className="action-icon" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="action-count">{likesCount}</span>
        </button>
        {console.log(`Rendering post ${post._id} - isLiked: ${isLiked}, likesCount: ${likesCount}`)} {/* Debug */}
        <button onClick={() => setShowReplies(!showReplies)} className={`action-btn ${showReplies ? 'active' : ''}`}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="action-count">{post.repliesCount || 0}</span>
        </button>

        {isAuthor && (
          <div className="author-actions">
            <button onClick={handleEdit} className="action-btn edit-btn">
              <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="action-btn delete-btn">
              <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showReplies && (
        <div className="post-replies-section">
          <div className="reply-form-wrapper">
            <div className="reply-avatar">
              <img
                src={getCurrentUserAvatar()}
                alt="Your avatar"
                className="reply-avatar-img"
                onError={(e) => (e.target.src = "/placeholder.svg")}
              />
            </div>
            <form onSubmit={handleReplySubmit} className="reply-form">
              <div className="reply-input-wrapper">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Écrire une réponse..."
                  className="reply-input"
                />
                <button
                  type="submit"
                  disabled={!newReply.trim() || replyLoading}
                  className="reply-submit-btn"
                >
                  {replyLoading ? (
                    <svg className="loading-spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="spinner-path" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="replies-list">
            {loadingReplies ? (
              <div className="replies-loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : replies.length > 0 ? (
              replies.map((reply) => (
                <div key={reply._id} className="reply-item">
                  <img
                    src={
                      getImageUrl(reply.author?.profilePicture, "avatar", reply.author?.username) || "/placeholder.svg"
                    }
                    alt={reply.author?.username}
                    className="reply-avatar-img"
                    onError={(e) => (e.target.src = getImageUrl(null, "avatar", reply.author?.username))}
                  />
                  <div className="reply-content">
                    <div className="reply-header">
                      <span className="reply-author">
                        {reply.author?.name || reply.author?.username}
                        {reply.author?.isVerified && <span className="verified-badge">✓</span>}
                      </span>
                      <span className="reply-time">{formatDate(reply.createdAt)}</span>
                    </div>
                    <div className="reply-text">{reply.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-replies">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Soyez le premier à répondre</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
