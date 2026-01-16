//frontend/src/components/CreatePost.jsx
"use client"

import { useState } from "react"
import "../styles/CreatePost.css"

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  const handleMediaChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
    if (!validTypes.includes(file.type)) {
      setError("Format de fichier non supporté. Utilisez JPG, PNG, GIF, WEBP, MP4 ou WEBM")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Maximum 10MB")
      return
    }

    setMediaFile(file)
    setMediaType(file.type.startsWith("image") ? "image" : "video")
    setError("")

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && !mediaFile) {
      setError("Le contenu ou un média est requis")
      return
    }

    if (content.length > 500) {
      setError("Le contenu ne peut pas dépasser 500 caractères")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      const formData = new FormData()
      formData.append("content", content)
      if (mediaFile) {
        formData.append("media", mediaFile)
      }

      const response = await fetch(`${API_URL}/threads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setContent("")
        removeMedia()
        if (onPostCreated) {
          // Ensure the post has all necessary data for display
          const postWithUserData = {
            ...data.data,
            author: {
              _id: data.data.author?._id || data.data.author,
              username: data.data.author?.username || 'Unknown',
              name: data.data.author?.name || data.data.author?.username || 'Unknown',
              profilePicture: data.data.author?.profilePicture || null,
              isVerified: data.data.author?.isVerified || false
            },
            likes: [],
            likesCount: 0,
            replies: [],
            repliesCount: 0,
            isLiked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          onPostCreated(postWithUserData)
        }
      } else {
        setError(data.message || "Erreur lors de la création du post")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
      console.error("Erreur:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit} className="create-post-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Quoi de neuf ?"
          className="create-post-textarea"
          rows="4"
          maxLength="500"
        />

        {mediaPreview && (
          <div className="media-preview">
            {mediaType === "image" ? (
              <img
                src={mediaPreview || "/placeholder.svg"}
                alt="Preview"
                className="media-preview-img"
                crossOrigin="anonymous"
              />
            ) : (
              <video src={mediaPreview} controls className="media-preview-video" crossOrigin="anonymous" />
            )}
            <button type="button" onClick={removeMedia} className="remove-media-btn">
              ✕
            </button>
          </div>
        )}

        <div className="create-post-footer">
          <div className="create-post-actions">
            <label htmlFor="media-upload" className="media-upload-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Photo/Vidéo</span>
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
              onChange={handleMediaChange}
              className="media-upload-input"
            />


            <span className="character-count">{content.length}/500</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="create-post-btn"
          >
            {isSubmitting ? "Publication..." : "Publier"}
          </button>
        </div>

        {error && <div className="create-post-error">{error}</div>}
      </form>
    </div>
  )
}

export default CreatePost
