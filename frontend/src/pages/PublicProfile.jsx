"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useToastContext } from "../contexts/ToastContext";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import HomeNavbar from "../components/HomeNavbar";
import Pagination from "../components/Pagination";
import { getImageUrl } from "../utils/imageHelper";
import "../styles/PublicProfile.css";
import API_URL from "../utils/api";

export default function PublicProfile() {
  const { username } = useParams();
  const { success, showError } = useToastContext();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [myFollowingIds, setMyFollowingIds] = useState(new Set()); // Stocker les IDs suivis
  const [pendingFollowIds, setPendingFollowIds] = useState(new Set()); // Demandes en attente
  const [sentRequests, setSentRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const currentUserIdFromStorage = localStorage.getItem("userId");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const profileId = profile?.id || profile?._id;
  const viewerId =
    currentUser?.id || currentUser?._id || currentUserIdFromStorage;
  const isViewingOwnProfile =
    profileId && viewerId && viewerId.toString() === profileId.toString();
  const safeFollowersCount = profile
    ? Math.max(profile.followersCount ?? 0, followers.length)
    : followers.length;
  const safeFollowingCount = profile
    ? Math.max(profile.followingCount ?? 0, following.length)
    : following.length;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Récupérer les infos de l'utilisateur connecté
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCurrentUser(data.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (username) {
      setCurrentPage(1); // Reset page when changing profile
      fetchProfile();
    }
  }, [username]);

  // Charger les abonnements de l'utilisateur actuel une seule fois
  useEffect(() => {
    if (currentUser) {
      fetchMyFollowing();
      fetchSentRequests();
    }
  }, [currentUser]);

  // Fetch posts when page changes
  useEffect(() => {
    if (profile && currentUser) {
      const canViewPrivate = () => {
        // Owner can always view their own profile
        if (currentUser.id === profile.id || currentUser._id === profile._id)
          return true;

        // Accepted followers can view private profile
        if (profile.isFollowing && profile.followStatus === "accepte")
          return true;

        return false;
      };

      if (!profile.isPrivate || canViewPrivate()) {
        fetchProfilePosts();
      }
    }
  }, [currentPage, profile, currentUser]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const fetchProfilePosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const postsRes = await fetch(
        `${API_URL}/threads/user/${profile.id}?page=${currentPage}&limit=10`,
        {
          headers,
        },
      );

      const postsData = await postsRes.json();

      if (postsData.success) {
        setPosts(postsData.data.threads || []);
        // Update pagination info
        if (postsData.data.pagination) {
          setPagination({
            currentPage: postsData.data.pagination.currentPage,
            totalPages: postsData.data.pagination.totalPages,
            totalItems: postsData.data.pagination.totalThreads,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching profile posts:", err);
    }
  };

  const fetchMyFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const myFollowingRes = await fetch(
        `${API_URL}/follows/${currentUser.id || currentUser._id}/following`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const myFollowingData = await myFollowingRes.json();
      if (myFollowingData.success) {
        const followingIds = new Set(
          (myFollowingData.data || []).map((user) => user._id || user.id),
        );
        console.log("My following IDs loaded:", followingIds); // Debug
        console.log("My following data:", myFollowingData.data); // Debug
        setMyFollowingIds(followingIds);
      }
    } catch (err) {
      console.error("Error fetching my following:", err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/follows/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSentRequests(data.data || []);
        setPendingFollowIds(
          new Set(
            (data.data || [])
              .map((req) => req.following?._id || req.following?.id)
              .filter(Boolean),
          ),
        );
      }
    } catch (err) {
      console.error("Error fetching sent requests:", err);
    }
  };

  // Reload profile when follow status changes (for private accounts)
  useEffect(() => {
    if (profile && profile.isPrivate) {
      if (profile.isFollowing && profile.followStatus === "accepte") {
        // Follow request accepted - grant full access to private profile
        const fetchPosts = async () => {
          try {
            const token = localStorage.getItem("token");
            const headers = {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            };

            const postsRes = await fetch(
              `${API_URL}/threads/user/${profile.id}`,
              {
                headers,
              },
            );

            const postsData = await postsRes.json();
            if (postsData.success) {
              setPosts(postsData.data.threads || []);
            }
          } catch (err) {
            console.error("Error fetching posts after follow acceptance:", err);
          }
        };

        fetchPosts();
      } else if (!profile.isFollowing || profile.followStatus === null) {
        // Follow rejected or removed - immediately revoke access
        setPosts([]);
      }
    }
  }, [profile?.isFollowing, profile?.followStatus]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Récupérer le profil
      const profileRes = await fetch(`${API_URL}/users/username/${username}`, {
        headers,
      });

      const profileData = await profileRes.json();

      if (profileData.success) {
        console.log("Profile data:", profileData.data); // Debug

        // Récupérer le statut de suivi de l'utilisateur actuel pour ce profil
        if (
          token &&
          currentUser &&
          currentUser.id !== profileData.data.id &&
          currentUser._id !== profileData.data._id
        ) {
          try {
            const followStatusRes = await fetch(
              `${API_URL}/follows/status/${profileData.data.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            const followStatusData = await followStatusRes.json();
            if (followStatusData.success) {
              console.log("Follow status data:", followStatusData.data); // Debug
              // Mettre à jour le profil avec les bonnes informations de suivi
              profileData.data.isFollowing = followStatusData.data.isFollowing;
              profileData.data.followStatus =
                followStatusData.data.followStatus;
            }
          } catch (err) {
            console.error("Error fetching follow status:", err);
            // En cas d'erreur, garder les valeurs par défaut
          }
        }

        setProfile(profileData.data);

        // Récupérer les listes d'abonnés/abonnements
        fetchFollowLists(profileData.data.id);

        // Check if user can view private profile
        const canViewPrivate = () => {
          if (!profileData.data) return false;

          // Owner can always view their own profile
          if (
            currentUser &&
            (currentUser.id === profileData.data.id ||
              currentUser._id === profileData.data._id)
          )
            return true;

          // Accepted followers can view private profile
          if (
            profileData.data.isFollowing &&
            profileData.data.followStatus === "accepte"
          )
            return true;

          return false;
        };

        // Si le profil est public, tout le monde peut voir les posts
        // Si le profil est privé, vérifier si l'utilisateur est autorisé
        if (!profileData.data.isPrivate || canViewPrivate()) {
          console.log(
            "✅ DEBUG: Fetching posts for profile:",
            profileData.data.username,
            "isPrivate:",
            profileData.data.isPrivate,
            "canViewPrivate:",
            canViewPrivate(),
          ); // Debug
          // Récupérer les posts avec pagination
          const postsRes = await fetch(
            `${API_URL}/threads/user/${profileData.data.id}?page=${currentPage}&limit=10`,
            {
              headers,
            },
          );

          const postsData = await postsRes.json();
          console.log("✅ DEBUG: Posts response:", postsData); // Debug

          if (postsData.success) {
            console.log(
              "✅ DEBUG: Setting posts:",
              postsData.data.threads?.length || 0,
              "posts",
            ); // Debug
            setPosts(postsData.data.threads || []);
            // Update pagination info
            if (postsData.data.pagination) {
              console.log(
                "✅ DEBUG: Pagination info:",
                postsData.data.pagination,
              ); // Debug
              setPagination({
                currentPage: postsData.data.pagination.currentPage,
                totalPages: postsData.data.pagination.totalPages,
                totalItems: postsData.data.pagination.totalThreads,
              });
            }
          } else {
            console.log("❌ DEBUG: Posts fetch failed:", postsData.message); // Debug
          }
        } else {
          console.log(
            "🔒 DEBUG: Cannot view private profile - isPrivate:",
            profileData.data.isPrivate,
            "canViewPrivate:",
            canViewPrivate(),
          ); // Debug
        }
      } else {
        setError(profileData.message || "Utilisateur non trouvé");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowLists = async (userId) => {
    try {
      setLoadingFollows(true);
      const token = localStorage.getItem("token");

      const [followersRes, followingRes] = await Promise.all([
        fetch(`${API_URL}/follows/${userId}/followers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_URL}/follows/${userId}/following`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      console.log("Raw followers data:", followersData.data); // Debug
      console.log("Raw following data:", followingData.data); // Debug

      // Utiliser les données brutes - le statut sera vérifié au clic
      if (followersData.success) setFollowers(followersData.data || []);
      if (followingData.success) setFollowing(followingData.data || []);
    } catch (err) {
      console.error("Error fetching follow lists:", err);
    } finally {
      setLoadingFollows(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour vous abonner à un utilisateur");
      return;
    }

    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/follows/${profile.id}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Recharger le profil pour obtenir les statuts à jour
        await fetchProfile();

        const message = profile.isPrivate
          ? "Demande d'abonnement envoyée !"
          : "Abonnement réussi !";
        success(message);

        // Mettre à jour myFollowingIds si l'abonnement est accepté (pour les comptes publics)
        if (!profile.isPrivate) {
          setMyFollowingIds(
            (prev) => new Set([...prev, profile.id || profile._id]),
          );
        }
      } else {
        showError(data.message || "Erreur lors de l'abonnement");
      }
    } catch (err) {
      console.error("Error following user:", err);
      showError("Erreur de connexion");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser) return;

    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/follows/${profile.id}/unfollow`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Recharger le profil pour obtenir les statuts à jour
        await fetchProfile();

        success("Vous n'êtes plus abonné à cet utilisateur");

        // Si c'est un compte privé, rediriger vers la recherche car on perd l'accès
        if (profile.isPrivate) {
          window.location.href = "/search";
        }
      } else {
        showError(data.message || "Erreur lors du désabonnement");
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
      showError("Erreur de connexion");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowUser = async (userId) => {
    if (!currentUser) return;
    const currentUserId = currentUser.id || currentUser._id;
    if (currentUserId && userId?.toString() === currentUserId.toString()) {
      showError("Vous ne pouvez pas vous suivre vous-même");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("Attempting to follow user:", userId); // Debug

      const response = await fetch(`${API_URL}/follows/${userId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("Follow response:", data, "Status:", response.status); // Debug

      if (response.ok && data.success) {
        const followStatus = data?.data?.status;

        if (followStatus === "en_attente") {
          setPendingFollowIds((prev) => new Set([...prev, userId]));
          success("Demande envoyée !");
          return;
        }

        setPendingFollowIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        // Mettre à jour myFollowingIds immédiatement
        setMyFollowingIds((prev) => new Set([...prev, userId]));

        // Rafraîchir les listes de follows
        fetchFollowLists(profile.id);

        success("Abonnement réussi !");
      } else {
        console.error("Follow failed:", data);

        // Si l'API dit qu'on suit déjà, mettre à jour l'état local
        if (data.message && data.message.includes("déjà")) {
          console.log("User says already following, updating local state"); // Debug
          if (data.message.toLowerCase().includes("demande")) {
            setPendingFollowIds((prev) => new Set([...prev, userId]));
          } else {
            setMyFollowingIds((prev) => new Set([...prev, userId]));
          }
        }

        showError(data.message || "Erreur lors de l'abonnement");
      }
    } catch (err) {
      console.error("Error following user:", err);
      showError("Erreur de connexion");
    }
  };

  const handleUnfollowUser = async (userId) => {
    if (!currentUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/follows/${userId}/unfollow`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPendingFollowIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        // Mettre à jour myFollowingIds immédiatement
        setMyFollowingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        // Rafraîchir les listes de follows
        fetchFollowLists(profile.id);

        // Si on se désabonne du propriétaire du profil et que c'est un compte privé
        if (userId === profile.id && profile.isPrivate) {
          success("Vous n'êtes plus abonné à cet utilisateur");
          window.location.href = "/search";
        }
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
    }
  };

  if (loading) {
    return (
      <>
        {!isLoggedIn && <HomeNavbar />}
        <div className="public-profile-loading">
          <div className="loading-spinner"></div>
          <p>Chargement du profil...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {!isLoggedIn && <HomeNavbar />}
        <div className="public-profile-error">
          <div className="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2>Profil introuvable</h2>
          <p>{error}</p>
          <Link to="/search" className="back-link">
            Retour à la recherche
          </Link>
        </div>
      </>
    );
  }

  // Check if user can view private profile
  const canViewPrivateProfile = () => {
    if (!profile) return false;

    // Owner can always view their own profile
    if (
      currentUser &&
      (currentUser.id === profile.id || currentUser._id === profile._id)
    )
      return true;

    // Accepted followers can view private profile (profile is no longer private for them)
    if (profile.isFollowing && profile.followStatus === "accepte") return true;

    return false;
  };

  // Compte privé et non autorisé
  if (profile.isPrivate && !canViewPrivateProfile()) {
    return (
      <>
        {!isLoggedIn && <HomeNavbar />}
        <div className="private-profile-container">
          <div className="private-profile-header">
            <div className="private-profile-avatar">
              <img
                src={getImageUrl(
                  profile.profilePicture,
                  "avatar",
                  profile.username,
                )}
                alt={profile.username}
                onError={(e) => {
                  e.target.src = getImageUrl(null, "avatar", profile.username);
                }}
              />
            </div>
            <div className="private-profile-info">
              <h2>{profile.name || profile.username}</h2>
              <p>@{profile.username}</p>
              {profile.isVerified && (
                <span className="verified-badge">✓ Vérifié</span>
              )}
            </div>
          </div>

          <div className="private-profile-message">
            <div className="lock-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3>Compte privé</h3>
            <p>Ce compte est privé. Abonnez-vous pour voir le contenu.</p>

            {currentUser ? (
              <button
                className="follow-request-btn"
                onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                disabled={followLoading}
              >
                {followLoading
                  ? "Chargement..."
                  : profile.isFollowing
                    ? "Se désabonner"
                    : "S'abonner"}
              </button>
            ) : (
              <div className="login-prompt">
                <p>Vous devez être connecté pour envoyer une demande de suivi.</p>
                <Link to="/login" className="login-link">
                  Se connecter
                </Link>
              </div>
            )}
          </div>

          <div className="private-profile-stats">
            <div className="stat-item">
              <span className="stat-number">{profile.threadsCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profile.followersCount}</span>
              <span className="stat-label">Abonnés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profile.followingCount}</span>
              <span className="stat-label">Abonnements</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Compte public ou suivi
  return (
    <div className={`public-profile-page ${!isLoggedIn ? "no-sidebar" : ""}`}>
      {isLoggedIn ? <Sidebar /> : <HomeNavbar />}
      <div className={`public-profile ${!isLoggedIn ? "no-sidebar" : ""}`}>
        <div className="public-profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-cover">
              {profile.coverImage ? (
                <img
                  src={getImageUrl(profile.coverImage, "cover")}
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
                  src={getImageUrl(
                    profile.profilePicture,
                    "avatar",
                    profile.username,
                  )}
                  alt={profile.username}
                  className="profile-avatar"
                  onError={(e) => {
                    e.target.src = getImageUrl(
                      null,
                      "avatar",
                      profile.username,
                    );
                  }}
                />
              </div>

              <div className="profile-info">
                <div className="profile-name-section">
                  <h2 className="profile-name">
                    {profile.name || profile.username}
                    {profile.isVerified && (
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
                  <p className="profile-username">@{profile.username}</p>
                </div>

                {isLoggedIn && profile && !isViewingOwnProfile && (
                  <div className="profile-actions">
                    {profile.isFollowing === true ? (
                      <button
                        className="unfollow-btn"
                        onClick={handleUnfollow}
                        disabled={followLoading}
                      >
                        {followLoading ? "Chargement..." : "Se désabonner"}
                      </button>
                    ) : (
                      <button
                        className="follow-btn"
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? "Chargement..." : "S'abonner"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              {/* Section Informations personnelles */}
              <div className="profile-personal-info">
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div className="profile-hobbies">
                    <h4>Centres d'intérêt</h4>
                    <div className="hobbies-list">
                      {profile.hobbies.map((hobby, index) => (
                        <span key={index} className="hobby-tag">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profile-meta">
                  {profile.location && (
                    <div className="profile-meta-item">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-1.414 0l-4.243-4.242a1.998 1.998 0 010-2.829L15.172 6.343a2 2 0 00-2.829 0L7.828 11.828a2 2 0 000 2.829l4.243 4.242a2 2 0 001.414 0z"
                        />
                      </svg>
                      {profile.location}
                    </div>
                  )}

                  {profile.birthDate && (
                    <div className="profile-meta-item">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(profile.birthDate).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  {profile.website && (
                    <div className="profile-meta-item">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}

                  {profile.isPrivate && (
                    <div className="profile-meta-item profile-private-indicator">
                      <svg
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
                </div>
              </div>

              {/* Stats */}
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-number">
                    {profile.threadsCount}
                  </div>
                  <div className="profile-stat-label">Posts</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">{safeFollowersCount}</div>
                  <div className="profile-stat-label">Abonnés</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">{safeFollowingCount}</div>
                  <div className="profile-stat-label">Abonnements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
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
          </div>

          {/* Followers Section */}
          {activeTab === "followers" && (
            <div className="profile-follow-list">
              {loadingFollows ? (
                <div className="profile-loading">Chargement...</div>
              ) : followers.length === 0 ? (
                <div className="profile-posts-empty">
                  {profile?.isPrivate &&
                  (!profile?.isFollowing || profile?.followStatus !== "accepte")
                    ? "Les abonnés de cet utilisateur apparaîtront ici une fois votre demande de suivi acceptée."
                    : "Aucun abonné pour le moment"}
                </div>
              ) : (
                followers.map((f) => {
                  const followerId = f._id || f.id;
                  const currentUserId = currentUser?.id || currentUser?._id;
                  const isSelf =
                    currentUserId &&
                    followerId?.toString() === currentUserId.toString();
                  const isFollowingThisUser = myFollowingIds.has(followerId); // Utiliser notre Set local
                  const isPendingFollow = pendingFollowIds.has(followerId);
                  const isPrivateUser = !!f.isPrivate;
                  console.log(
                    `Follower ${f.username}: ID=${followerId}, isFollowing=${isFollowingThisUser}`,
                  ); // Debug
                  return (
                    <div key={followerId} className="follow-card">
                      {isSelf ? (
                        <>
                          <img
                            src={
                              getImageUrl(
                                f.profilePicture,
                                "avatar",
                                f.username,
                              ) || "/placeholder.svg"
                            }
                            className="follow-avatar"
                            alt={f.username}
                            onError={(e) =>
                              (e.target.src = getImageUrl(
                                null,
                                "avatar",
                                f.username,
                              ))
                            }
                          />
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.name || f.username}
                            </div>
                            <div className="follow-username">@{f.username}</div>
                            {f.isVerified && (
                              <span className="verified-badge">✓</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <Link
                          to={`/profile/${f.username}`}
                          className="follow-user-link"
                        >
                          <img
                            src={
                              getImageUrl(
                                f.profilePicture,
                                "avatar",
                                f.username,
                              ) || "/placeholder.svg"
                            }
                            className="follow-avatar"
                            alt={f.username}
                            onError={(e) =>
                              (e.target.src = getImageUrl(
                                null,
                                "avatar",
                                f.username,
                              ))
                            }
                          />
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.name || f.username}
                            </div>
                            <div className="follow-username">@{f.username}</div>
                            {f.isVerified && (
                              <span className="verified-badge">✓</span>
                            )}
                          </div>
                        </Link>
                      )}
                      {isSelf ? (
                        <span className="follow-self-label">Vous</span>
                      ) : isFollowingThisUser ? (
                        <button
                          className="unfollow-btn"
                          onClick={() => {
                            console.log(`Unfollowing user: ${followerId}`); // Debug
                            handleUnfollowUser(followerId);
                          }}
                          title="Se désabonner"
                        >
                          Se désabonner
                        </button>
                      ) : isPendingFollow ? (
                        <button
                          className="unfollow-btn"
                          onClick={() => handleUnfollowUser(followerId)}
                          title="Se désabonner"
                        >
                          Se désabonner
                        </button>
                      ) : (
                        <button
                          className="follow-btn"
                          onClick={() => {
                            console.log(`Following user: ${followerId}`); // Debug
                            handleFollowUser(followerId);
                          }}
                          title="S'abonner"
                        >
                          S'abonner
                        </button>
                      )}
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
                <div className="profile-posts-empty">
                  {profile?.isPrivate &&
                  (!profile?.isFollowing || profile?.followStatus !== "accepte")
                    ? "Les abonnements de cet utilisateur apparaîtront ici une fois votre demande de suivi acceptée."
                    : "Aucun abonnement pour le moment"}
                </div>
              ) : (
                following.map((f) => {
                  const followingId = f._id || f.id;
                  const currentUserId = currentUser?.id || currentUser?._id;
                  const isSelf =
                    currentUserId &&
                    followingId?.toString() === currentUserId.toString();
                  const isFollowingThisUser =
                    isViewingOwnProfile || myFollowingIds.has(followingId);
                  const isPendingFollow = pendingFollowIds.has(followingId);
                  const isPrivateUser = !!f.isPrivate;
                  console.log(
                    `Following ${f.username}: ID=${followingId}, isFollowing=${isFollowingThisUser}`,
                  ); // Debug
                  return (
                    <div key={followingId} className="follow-card">
                      {isSelf ? (
                        <>
                          <img
                            src={
                              getImageUrl(
                                f.profilePicture,
                                "avatar",
                                f.username,
                              ) || "/placeholder.svg"
                            }
                            className="follow-avatar"
                            alt={f.username}
                            onError={(e) =>
                              (e.target.src = getImageUrl(
                                null,
                                "avatar",
                                f.username,
                              ))
                            }
                          />
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.name || f.username}
                            </div>
                            <div className="follow-username">@{f.username}</div>
                            {f.isVerified && (
                              <span className="verified-badge">✓</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <Link
                          to={`/profile/${f.username}`}
                          className="follow-user-link"
                        >
                          <img
                            src={
                              getImageUrl(
                                f.profilePicture,
                                "avatar",
                                f.username,
                              ) || "/placeholder.svg"
                            }
                            className="follow-avatar"
                            alt={f.username}
                            onError={(e) =>
                              (e.target.src = getImageUrl(
                                null,
                                "avatar",
                                f.username,
                              ))
                            }
                          />
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.name || f.username}
                            </div>
                            <div className="follow-username">@{f.username}</div>
                            {f.isVerified && (
                              <span className="verified-badge">✓</span>
                            )}
                          </div>
                        </Link>
                      )}
                      {isSelf ? (
                        <span className="follow-self-label">Vous</span>
                      ) : isFollowingThisUser ? (
                        <button
                          className="unfollow-btn"
                          onClick={() => handleUnfollowUser(followingId)}
                          title="Se désabonner"
                        >
                          Se désabonner
                        </button>
                      ) : isPendingFollow ? (
                        <button
                          className="unfollow-btn"
                          onClick={() => handleUnfollowUser(followingId)}
                          title="Se désabonner"
                        >
                          Se désabonner
                        </button>
                      ) : (
                        <button
                          className="follow-btn"
                          onClick={() => handleFollowUser(followingId)}
                          title="S'abonner"
                        >
                          S'abonner
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Posts Section */}
          {activeTab === "posts" && (
            <div className="profile-posts-section">
              <h3 className="posts-title">Posts</h3>

              {posts.length === 0 ? (
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
                  <p>
                    {profile.isPrivate
                      ? "Les posts de cet utilisateur apparaîtront ici une fois votre demande de suivi acceptée."
                      : "Cet utilisateur n'a pas encore publié de post."}
                  </p>
                </div>
              ) : (
                <div className="posts-grid">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      showFollowButton={false}
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
                      currentUser={currentUser}
                    />
                  ))}

                  {/* Pagination for posts */}
                  {posts.length > 0 && (
                    <div
                      className="pagination-container"
                      style={{ gridColumn: "1 / -1", marginTop: "20px" }}
                    >
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        itemsPerPage={10}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
