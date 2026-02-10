"use client";

import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useToastContext } from "../../contexts/ToastContext";
import PostCard from "../../components/PostCard";
import Pagination from "../../components/Pagination";
import { getImageUrl, handleImageError } from "../../utils/imageHelper";
import API_URL from "../../utils/api";
import "../../styles/DashboardProfile.css";

export default function DashboardProfile() {
  const { user, setUser } = useOutletContext();
  const { success, error: showError } = useToastContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posts");

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingSentRequests, setLoadingSentRequests] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollows, setLoadingFollows] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    hobbies: user?.hobbies || [],
    birthDate: user?.birthDate || "",
    isPrivate: user?.isPrivate || false,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const safeFollowersCount = Math.max(
    user?.followersCount || 0,
    followers.length,
  );
  const safeFollowingCount = Math.max(
    user?.followingCount || 0,
    following.length,
  );

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchUserPosts(userId);
      fetchPendingRequests();
      fetchSentRequests();
      fetchFollowLists(userId);
    }
  }, [user]);

  const fetchUserPosts = async (userIdParam, pageNum = 1) => {
    const userId =
      userIdParam || user?._id || user?.id || localStorage.getItem("userId");

    if (!userId || userId === "undefined") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/threads/user/${userId}?page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setPosts(data.data.threads || []);

        // Update pagination info
        if (data.data.pagination) {
          setPagination({
            currentPage: data.data.pagination.currentPage,
            totalPages: data.data.pagination.totalPages,
            totalItems: data.data.pagination.totalThreads,
          });
          setCurrentPage(data.data.pagination.currentPage);
        }
      } else {
        setError("Erreur lors du chargement des posts");
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setError("Erreur lors du chargement des posts");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchUserPosts(undefined, newPage);
  };

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");

      // Add timestamp to prevent caching
      const timestamp = Date.now();

      const response = await fetch(
        `${API_URL}/follows/pending?t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setPendingRequests(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      setLoadingSentRequests(true);
      const token = localStorage.getItem("token");
      const timestamp = Date.now();

      const response = await fetch(
        `${API_URL}/follows/sent?t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSentRequests(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching sent requests:", err);
    } finally {
      setLoadingSentRequests(false);
    }
  };

  const fetchFollowLists = async (userId) => {
    try {
      console.log("Fetching follow lists for userId:", userId);
      setLoadingFollows(true);
      const token = localStorage.getItem("token");

      // Add timestamp to prevent caching
      const timestamp = Date.now();

      const [followersRes, followingRes] = await Promise.all([
        fetch(`${API_URL}/follows/${userId}/followers?t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/follows/${userId}/following?t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log("Followers response status:", followersRes.status);
      console.log("Following response status:", followingRes.status);
      console.log("Followers headers:", followersRes.headers);
      console.log("Following headers:", followingRes.headers);

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      console.log("Followers data:", followersData);
      console.log("Following data:", followingData);
      console.log("Followers data type:", typeof followersData.data);
      console.log("Following data type:", typeof followingData.data);
      console.log("Followers data length:", followersData.data?.length);
      console.log("Following data length:", followingData.data?.length);

      if (followersData.success) {
        console.log("Setting followers:", followersData.data);
        setFollowers(followersData.data);
      } else {
        console.log("Followers API failed:", followersData);
      }

      if (followingData.success) {
        console.log("Setting following:", followingData.data);
        setFollowing(followingData.data);
      } else {
        console.log("Following API failed:", followingData);
      }
    } catch (err) {
      console.error("Error fetching follow lists:", err);
    } finally {
      setLoadingFollows(false);
    }
  };

  const handleAcceptRequest = async (followerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/follows/${followerId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Remove from pending requests
        setPendingRequests((prev) =>
          prev.filter(
            (req) =>
              req.follower._id !== followerId && req.follower.id !== followerId,
          ),
        );

        // Add to followers list since they are now following us
        const acceptedUser = pendingRequests.find(
          (req) =>
            req.follower._id === followerId || req.follower.id === followerId,
        );
        if (acceptedUser) {
          setFollowers((prev) => [...prev, acceptedUser.follower]);
        }
        setUser((prev) => ({
          ...prev,
          followersCount: (prev.followersCount || 0) + 1,
        }));

        success("Demande acceptée");
      }
    } catch (err) {
      console.error("Error accepting request:", err);
      showError("Erreur lors de l'acceptation de la demande");
    }
  };

  const handleRejectRequest = async (followerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/follows/${followerId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPendingRequests((prev) =>
          prev.filter(
            (req) =>
              req.follower._id !== followerId && req.follower.id !== followerId,
          ),
        );
        success("Demande rejetée");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      showError("Erreur lors du rejet de la demande");
    }
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/follows/${followerId}/remove-follower`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        // Retirer de la liste des followers
        setFollowers((prev) =>
          prev.filter((f) => f._id !== followerId && f.id !== followerId),
        );
        // Mettre à jour le compteur
        setUser((prev) => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1),
        }));
        success("Abonné supprimé avec succès");
      }
    } catch (err) {
      console.error("Error removing follower:", err);
      showError("Erreur lors de la suppression de l'abonné");
    }
  };

  const handleUnfollow = async (followingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/follows/${followingId}/unfollow`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        // Retirer de la liste des following
        setFollowing((prev) =>
          prev.filter((f) => f._id !== followingId && f.id !== followingId),
        );
        // Mettre à jour le compteur
        setUser((prev) => ({
          ...prev,
          followingCount: Math.max(0, (prev.followingCount || 0) - 1),
        }));
        success("Se désabonné");
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
      showError("Erreur lors du désabonnement");
    }
  };

  const handleCancelRequest = async (followingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/follows/${followingId}/unfollow`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSentRequests((prev) =>
          prev.filter(
            (req) =>
              req.following._id !== followingId &&
              req.following.id !== followingId,
          ),
        );
        success("Demande annulée");
      }
    } catch (err) {
      console.error("Error canceling request:", err);
      showError("Erreur lors de l'annulation de la demande");
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPrivate: !user.isPrivate }),
      });
      const data = await response.json();
      if (data.success && setUser) setUser(data.data);
    } catch (err) {
      console.error("Error toggling privacy:", err);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = window.location.href;
    navigator.clipboard
      .writeText(profileUrl)
      .then(() => success("Lien du profil copié dans le presse-papier !"))
      .catch((err) => console.error("Erreur lors de la copie :", err));
  };

  const handleEditClick = () => {
    setEditFormData({
      name: user?.name || user?.username || "",
      bio: user?.bio || "",
      location: user?.location || "",
      website: user?.website || "",
      hobbies: user?.hobbies || [],
      birthDate: user?.birthDate ? user.birthDate.split("T")[0] : "",
      isPrivate: user?.isPrivate || false,
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (profileImageFile) {
        const formData = new FormData();
        formData.append("profilePicture", profileImageFile);
        await fetch(`${API_URL}/users/me/profile-picture`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      if (coverImageFile) {
        const formData = new FormData();
        formData.append("coverImage", coverImageFile);
        await fetch(`${API_URL}/users/me/cover-image`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (setUser) setUser(data.data);
        setIsEditing(false);
        setProfileImageFile(null);
        setCoverImageFile(null);
        success("Profil mis à jour avec succès !");
      } else {
        setError(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  const handleUpdatePost = (postId, updatedData) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, ...updatedData } : post,
      ),
    );
  };

  return (
    <div className="profile-page">
      {isEditing && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h3>Modifier le profil</h3>
              <button
                className="close-modal-btn"
                onClick={() => setIsEditing(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="form-group">
                <label>Photo de profil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files[0])}
                />
              </div>
              <div className="form-group">
                <label>Photo de couverture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImageFile(e.target.files[0])}
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  placeholder="Votre nom"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleInputChange}
                  placeholder="Dites-nous en plus sur vous..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Localisation</label>
                <input
                  type="text"
                  name="location"
                  value={editFormData.location}
                  onChange={handleInputChange}
                  placeholder="Ville, Pays"
                />
              </div>
              <div className="form-group">
                <label>Site web</label>
                <input
                  type="url"
                  name="website"
                  value={editFormData.website}
                  onChange={handleInputChange}
                  placeholder="https://votresite.com"
                />
              </div>
              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="birthDate"
                  value={editFormData.birthDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Centres d'intérêt (séparés par des virgules)</label>
                <input
                  type="text"
                  name="hobbies"
                  value={editFormData.hobbies.join(", ")}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      hobbies: e.target.value
                        .split(",")
                        .map((h) => h.trim())
                        .filter((h) => h),
                    }))
                  }
                  placeholder="Ex: Lecture, Sport, Musique"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={editFormData.isPrivate}
                    onChange={handleInputChange}
                  />
                  <span>
                    Compte privé (les abonnements doivent être approuvés)
                  </span>
                </label>
              </div>
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          {user?.coverImage ? (
            <img
              src={getImageUrl(user.coverImage, "cover") || "/placeholder.svg"}
              alt="Cover"
              className="profile-cover-image"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="profile-cover-placeholder" />
          )}
        </div>

        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <img
              src={
                getImageUrl(user?.profilePicture, "avatar", user?.username) ||
                "/placeholder.svg"
              }
              alt={user?.username || "Profile"}
              className="profile-avatar"
              onError={handleImageError}
            />
          </div>

          <div className="profile-info">
            <div className="profile-name-section">
              <h2 className="profile-name">
                {user.name || user.username}
                {user.isVerified && (
                  <span className="profile-verified-badge">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </h2>
              <p className="profile-username">@{user.username}</p>
            </div>

            <div className="profile-actions">
              <button className="profile-edit-btn" onClick={handleEditClick}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 0l4 4a2 2 0 11-2.827 0l-1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Modifier
              </button>
              <button
                className={`profile-privacy-btn ${
                  user.isPrivate ? "private" : "public"
                }`}
                onClick={handleTogglePrivacy}
              >
                {user.isPrivate ? "Compte Privé" : "Compte Public"}
              </button>
            </div>
          </div>

          {user.bio && <p className="profile-bio">{user.bio}</p>}

          {/* Section Informations personnelles */}
          <div className="profile-personal-info">
            {user.hobbies && user.hobbies.length > 0 && (
              <div className="profile-hobbies">
                <h4>Centres d'intérêt</h4>
                <div className="hobbies-list">
                  {user.hobbies.map((hobby, index) => (
                    <span key={index} className="hobby-tag">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-meta">
              {user.location && (
                <div className="profile-meta-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-1.414 0l-4.243-4.242a1.998 1.998 0 010-2.829L15.172 6.343a2 2 0 00-2.829 0L7.828 11.828a2 2 0 000 2.829l4.243 4.242a2 2 0 001.414 0z"
                    />
                  </svg>
                  {user.location}
                </div>
              )}

              {user.birthDate && (
                <div className="profile-meta-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(user.birthDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}

              {user.website && (
                <div className="profile-meta-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {user.website}
                  </a>
                </div>
              )}

              <div className="profile-meta-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Membre depuis{" "}
                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-number">
                {user.threadsCount || 0}
              </div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number">
                {safeFollowersCount}
              </div>
              <div className="profile-stat-label">Abonnés</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number">
                {safeFollowingCount}
              </div>
              <div className="profile-stat-label">Suivis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile : menu déroulant */}
      <div className="profile-tabs-select-wrapper">
        <select
          className="profile-tabs-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          aria-label="Choisir une section"
        >
          <option value="posts">Posts</option>
          <option value="followers">Abonnés ({safeFollowersCount})</option>
          <option value="following">Abonnements ({safeFollowingCount})</option>
          <option value="requests">Demandes ({pendingRequests.length})</option>
          <option value="sent">Envoyées ({sentRequests.length})</option>
        </select>
      </div>

      {/* Desktop : onglets */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button
          className={`profile-tab ${activeTab === "followers" ? "active" : ""}`}
          onClick={() => setActiveTab("followers")}
        >
          Abonnés ({safeFollowersCount})
        </button>
        <button
          className={`profile-tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => setActiveTab("following")}
        >
          Abonnements ({safeFollowingCount})
        </button>
        <button
          className={`profile-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Demandes ({pendingRequests.length})
        </button>
        <button
          className={`profile-tab ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          Envoyées ({sentRequests.length})
        </button>
      </div>

      {/* Followers Section */}
      {activeTab === "followers" && (
        <div className="profile-follow-list">
          {loadingFollows ? (
            <div className="profile-loading">Chargement...</div>
          ) : followers.length === 0 ? (
            <div className="profile-posts-empty">
              {user?.isPrivate
                ? "Les abonnés de cet utilisateur apparaîtront ici une fois votre demande de suivi acceptée."
                : "Aucun abonné pour le moment"}
            </div>
          ) : (
            followers.map((f) => {
              const followerId = f._id || f.id;
              return (
                <div key={followerId} className="follow-card">
                  <Link
                    to={`/profile/${f.username}`}
                    className="follow-user-link"
                  >
                    <img
                      src={
                        getImageUrl(f.profilePicture, "avatar", f.username) ||
                        "/placeholder.svg"
                      }
                      className="follow-avatar"
                      alt={f.username}
                      onError={handleImageError}
                    />
                    <div className="follow-info">
                      <div className="follow-name">{f.name || f.username}</div>
                      <div className="follow-username">@{f.username}</div>
                    </div>
                  </Link>
                  <button
                    className="remove-follower-btn"
                    onClick={() => handleRemoveFollower(followerId)}
                    title="Supprimer cet abonné"
                  >
                    Supprimer
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Following Section */}
      {activeTab === "following" && (
        <div className="profile-follow-list">
          {loadingFollows ? (
            <div className="profile-loading">Chargement...</div>
          ) : following.length === 0 ? (
            <div className="profile-posts-empty">Vous ne suivez personne</div>
          ) : (
            following.map((f) => {
              const followingId = f._id || f.id;
              return (
                <div key={followingId} className="follow-card">
                  <Link
                    to={`/profile/${f.username}`}
                    className="follow-user-link"
                  >
                    <img
                      src={
                        getImageUrl(f.profilePicture, "avatar", f.username) ||
                        "/placeholder.svg"
                      }
                      className="follow-avatar"
                      alt={f.username}
                      onError={handleImageError}
                    />
                    <div className="follow-info">
                      <div className="follow-name">{f.name || f.username}</div>
                      <div className="follow-username">@{f.username}</div>
                    </div>
                  </Link>
                  <button
                    className="unfollow-btn"
                    onClick={() => handleUnfollow(followingId)}
                    title="Se désabonner"
                  >
                    Se désabonner
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Posts Section */}
      {activeTab === "posts" && (
        <div className="profile-posts-section">
          {error && <div className="profile-error">{error}</div>}

          {loading ? (
            <div className="profile-loading">Chargement de vos posts...</div>
          ) : posts.length === 0 ? (
            <div className="profile-posts-empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <h3>Aucun post pour le moment</h3>
              <p>Commencez à partager vos idées sur Linker</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handleDeletePost}
                  onUpdate={handleUpdatePost}
                  currentUser={user}
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
            </>
          )}
        </div>
      )}

      {/* Requests Section */}
      {activeTab === "requests" && (
        <div className="profile-requests-section">
          {loadingRequests ? (
            <div className="profile-loading">Chargement des demandes...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="profile-posts-empty">
              <h3>Aucune demande en attente</h3>
              <p>Les demandes d'abonnement apparaîtront ici</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map((request) => {
                const follower = request.follower;
                const followerId = follower._id || follower.id;

                return (
                  <div key={followerId} className="request-card">
                    <Link
                      to={`/profile/${follower.username}`}
                      className="request-user-link"
                    >
                      <img
                        src={
                          follower.profilePicture ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            follower.username || "/placeholder.svg",
                          )}&size=50&background=4FD04C&color=fff&bold=true`
                        }
                        alt={follower.username}
                        className="request-avatar"
                      />
                      <div className="request-info">
                        <h4>
                          {follower.name || follower.username}
                          {follower.isVerified && " ✓"}
                        </h4>
                        <p>@{follower.username}</p>
                        {follower.bio && (
                          <p className="request-bio">{follower.bio}</p>
                        )}
                      </div>
                    </Link>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(followerId)}
                      >
                        Accepter
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRequest(followerId)}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sent Requests Section */}
      {activeTab === "sent" && (
        <div className="profile-sent-section">
          {loadingSentRequests ? (
            <div className="profile-loading">
              Chargement des demandes envoyées...
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="profile-posts-empty">
              <h3>Aucune demande envoyée</h3>
              <p>Vos demandes d'abonnement apparaîtront ici</p>
            </div>
          ) : (
            <div className="sent-requests-list">
              {sentRequests.map((request) => {
                const followingUser = request.following;
                const followingId = followingUser._id || followingUser.id;

                return (
                  <div key={followingId} className="sent-request-card">
                    <Link
                      to={`/profile/${followingUser.username}`}
                      className="sent-request-user-link"
                    >
                      <img
                        src={
                          followingUser.profilePicture ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            followingUser.username || "/placeholder.svg",
                          )}&size=50&background=4FD04C&color=fff&bold=true`
                        }
                        alt={followingUser.username}
                        className="sent-request-avatar"
                      />
                      <div className="sent-request-info">
                        <h4>
                          {followingUser.name || followingUser.username}
                          {followingUser.isVerified && " ✓"}
                        </h4>
                        <p>@{followingUser.username}</p>
                        {followingUser.bio && (
                          <p className="sent-request-bio">
                            {followingUser.bio}
                          </p>
                        )}
                        {followingUser.isPrivate && (
                          <span className="sent-request-status">
                            En attente d'approbation
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="sent-request-actions">
                      <button
                        className="cancel-request-btn"
                        onClick={() => handleCancelRequest(followingId)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
