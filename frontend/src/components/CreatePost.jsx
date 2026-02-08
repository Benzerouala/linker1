"use client";

import { useEffect, useRef, useState } from "react";
import { useToastContext } from "../contexts/ToastContext";
import { getImageUrl } from "../utils/imageHelper";
import "../styles/CreatePost.css";

const CreatePost = ({ onPostCreated }) => {
  const { success } = useToastContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionRange, setMentionRange] = useState(null);
  const textareaRef = useRef(null);
  const mentionRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const updateMentionState = (value, cursorPos) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9._-]{0,30})$/);

    if (!match) {
      setIsMentionOpen(false);
      setMentionQuery("");
      setMentionSuggestions([]);
      setMentionRange(null);
      setActiveMentionIndex(0);
      return;
    }

    const query = match[1] || "";
    const atIndex = textBeforeCursor.lastIndexOf("@");
    setMentionRange({ start: atIndex, end: cursorPos });
    setMentionQuery(query);
    setIsMentionOpen(true);
    setActiveMentionIndex(0);
  };

  useEffect(() => {
    if (!isMentionOpen || mentionQuery.trim().length === 0) {
      setMentionSuggestions([]);
      setIsMentionLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsMentionLoading(true);
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const response = await fetch(
          `${API_URL}/users/search?q=${encodeURIComponent(mentionQuery)}&limit=6`,
          { headers },
        );
        const data = await response.json();
        if (data.success) {
          setMentionSuggestions(data.data || []);
        } else {
          setMentionSuggestions([]);
        }
        setActiveMentionIndex(0);
      } catch (error) {
        console.error("Erreur lors de la recherche de mentions:", error);
        setMentionSuggestions([]);
      } finally {
        setIsMentionLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [mentionQuery, isMentionOpen, API_URL]);

  useEffect(() => {
    if (!isMentionOpen) return;

    const handleClickOutside = (event) => {
      if (mentionRef.current && !mentionRef.current.contains(event.target)) {
        setIsMentionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMentionOpen]);

  const handleSelectMention = (user) => {
    if (!mentionRange) return;

    const username = user?.username;
    if (!username) return;

    const before = content.slice(0, mentionRange.start);
    const after = content.slice(mentionRange.end);
    const nextContent = `${before}@${username} ${after}`;
    const nextCursor = before.length + username.length + 2;

    setContent(nextContent);
    setIsMentionOpen(false);
    setMentionQuery("");
    setMentionSuggestions([]);
    setMentionRange(null);
    setActiveMentionIndex(0);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    if (!validTypes.includes(file.type)) {
      setError(
        "Format de fichier non supporté. Utilisez JPG, PNG, GIF, WEBP, MP4 ou WEBM",
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Maximum 10MB");
      return;
    }

    setMediaFile(file);
    setMediaType(file.type.startsWith("image") ? "image" : "video");
    setError("");

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!content.trim() && !mediaFile) {
    setError("Le contenu ou un média est requis");
    return;
  }

  if (content.length > 500) {
    setError("Le contenu ne peut pas dépasser 500 caractères");
    return;
  }

  setIsSubmitting(true);
  setError("");

  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("content", content);
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    const response = await fetch(`${API_URL}/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setContent("");
      removeMedia();
      success("✓ Post publié avec succès !");
      
      if (onPostCreated) {
        // Ensure post has all necessary data for display
        const postWithUserData = {
          ...data.data,
          author: {
            _id: data.data.author?._id || data.data.author,
            username: data.data.author?.username || "Unknown",
            name:
              data.data.author?.name ||
              data.data.author?.username ||
              "Unknown",
            profilePicture: data.data.author?.profilePicture || null,
            isVerified: data.data.author?.isVerified || false,
          },
          likes: [],
          likesCount: 0,
          replies: [],
          repliesCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onPostCreated(postWithUserData);
      }
    } else {
      setError(data.message || "Erreur lors de la création du post");
    }
  } catch (err) {
    setError("Erreur de connexion au serveur");
    console.error("Erreur:", err);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="textarea-wrapper" ref={mentionRef}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              const value = e.target.value;
              setContent(value);
              updateMentionState(value, e.target.selectionStart || value.length);
            }}
            onKeyDown={(e) => {
              if (!isMentionOpen || mentionSuggestions.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveMentionIndex((prev) =>
                  prev + 1 >= mentionSuggestions.length ? 0 : prev + 1,
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveMentionIndex((prev) =>
                  prev - 1 < 0 ? mentionSuggestions.length - 1 : prev - 1,
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                handleSelectMention(mentionSuggestions[activeMentionIndex]);
              } else if (e.key === "Escape") {
                setIsMentionOpen(false);
              }
            }}
            onKeyUp={(e) => {
              updateMentionState(
                e.currentTarget.value,
                e.currentTarget.selectionStart || e.currentTarget.value.length,
              );
            }}
            placeholder="Quoi de neuf ? (Utilisez @username pour mentionner quelqu'un)"
            className="create-post-textarea"
            rows="4"
            maxLength="500"
          />

          {isMentionOpen && (
            <div className="mention-suggestions">
              {isMentionLoading ? (
                <div className="mention-suggestion-state">Recherche...</div>
              ) : mentionQuery.trim().length === 0 ? (
                <div className="mention-suggestion-state">
                  Tapez pour trouver un utilisateur
                </div>
              ) : mentionSuggestions.length === 0 ? (
                <div className="mention-suggestion-state">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                mentionSuggestions.map((user, index) => (
                  <button
                    key={user._id || user.id || user.username}
                    type="button"
                    className={`mention-suggestion-item${
                      index === activeMentionIndex ? " active" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectMention(user)}
                  >
                    <img
                      src={getImageUrl(
                        user.profilePicture,
                        "avatar",
                        user.username,
                      )}
                      alt={user.username}
                      className="mention-suggestion-avatar"
                    />
                    <div className="mention-suggestion-info">
                      <span className="mention-suggestion-name">
                        {user.name || user.username}
                      </span>
                      <span className="mention-suggestion-username">
                        @{user.username}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

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
              <video
                src={mediaPreview}
                controls
                className="media-preview-video"
                crossOrigin="anonymous"
              />
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="remove-media-btn"
            >
              ✕
            </button>
          </div>
        )}

        <div className="create-post-footer">
          <div className="create-post-actions">
            <label htmlFor="media-upload" className="media-upload-label">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
            onPointerDown={(e) => {
              /* Sur tactile : soumettre au 1er tap (évite blur du textarea qui annule le clic) */
              if (e.pointerType === "touch") {
                e.preventDefault();
                if (!isSubmitting && (content.trim() || mediaFile)) {
                  handleSubmit(e);
                }
              }
            }}
          >
            {isSubmitting ? "Publication..." : "Publier"}
          </button>
        </div>

        {error && <div className="create-post-error">{error}</div>}
      </form>
    </div>
  );
};

export default CreatePost;
