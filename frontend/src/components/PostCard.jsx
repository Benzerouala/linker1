"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import { useToastContext } from "../contexts/ToastContext";
import ConfirmModal from "./ConfirmModal";
import EditPostModal from "./EditPostModal";
import NestedReply from "./NestedReply";
import LikesModal from "./LikesModal";
import "../styles/PostCard.css";
import API_URL from "../utils/api";

const PostCard = ({
  post,
  onDelete,
  onUpdate,
  autoOpenReplies = false,
  focusReplyId = null,
  showFollowButton = true,
  currentUser: currentUserProp = null,
}) => {
  const { success, error: showError } = useToastContext();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    post.repostedFrom?.author?.isFollowing ??
      post.author?.isFollowing ??
      false,
  );
  const [followLoading, setFollowLoading] = useState(false);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount || 0);
  const [repostLoading, setRepostLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState(null);
  const [isDeletingReply, setIsDeletingReply] = useState(false);
  const [replyLikes, setReplyLikes] = useState({});
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  const [nestedReplyText, setNestedReplyText] = useState({});
  const [nestedReplyLoading, setNestedReplyLoading] = useState({});
  const [repliesVersion, setRepliesVersion] = useState(0);
  const [autoExpandReplyIds, setAutoExpandReplyIds] = useState(new Set());
  const [showPostLikesModal, setShowPostLikesModal] = useState(false);
  const [postLikesLoading, setPostLikesLoading] = useState(false);
  const [postLikesUsers, setPostLikesUsers] = useState([]);
  const replyScrollRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [currentUserFromApi, setCurrentUserFromApi] = useState(null);
  const navigate = useNavigate();

  const effectiveCurrentUser = currentUserProp || currentUserFromApi;

  const ensureLoggedIn = (message) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoginModalMessage(message);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likesCount || 0);
    setIsReposted(post.isReposted || false);
    setRepostsCount(post.repostsCount || 0);
  }, [
    post.isLiked,
    post.likesCount,
    post.isReposted,
    post.repostsCount,
    post._id,
  ]);

  useEffect(() => {
    if (showReplies) {
      setRepliesVersion((prev) => prev + 1);
    }
  }, [showReplies]);

  useEffect(() => {
    setIsFollowing(
      post.repostedFrom?.author?.isFollowing ??
        post.author?.isFollowing ??
        false,
    );
  }, [post._id, post.repostedFrom?.author?.isFollowing, post.author?.isFollowing]);

  const autoOpenHandledRef = useRef(null);

  useEffect(() => {
    if (!autoOpenReplies) return;
    const autoOpenKey = focusReplyId || post._id;
    if (autoOpenHandledRef.current === autoOpenKey) return;
    setShowReplies(true);
    autoOpenHandledRef.current = autoOpenKey;
  }, [autoOpenReplies, focusReplyId, post._id]);

  const currentUserId = localStorage.getItem("userId");
  const author = post.author || {};
  const originalPost = post.repostedFrom || null;
  const isRepost = !!post.repostedFrom;
  const displayAuthor =
    isRepost && originalPost?.author ? originalPost.author : author;
  const isAuthor = currentUserId === displayAuthor._id?.toString();
  const isRepostOwner = isRepost && currentUserId === author._id?.toString();

  // Fonction pour vérifier si une réponse est la nôtre
  const isMyReply = (replyAuthorId) => {
    return currentUserId && replyAuthorId?.toString() === currentUserId;
  };

  useEffect(() => {
    if (currentUserProp) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { if (data.success) setCurrentUserFromApi(data.data); })
      .catch(() => {});
  }, [API_URL, currentUserProp]);

  const formatDate = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const findReplyPath = (replyList, targetId, path = []) => {
    for (const reply of replyList) {
      if (reply._id === targetId) {
        return [...path, reply._id];
      }

      if (reply.children && reply.children.length > 0) {
        const childPath = findReplyPath(reply.children, targetId, [
          ...path,
          reply._id,
        ]);
        if (childPath) {
          return childPath;
        }
      }
    }

    return null;
  };

  const updateRepliesTree = (replyList, replyId, updater) => {
    return replyList.map((reply) => {
      if (reply._id === replyId) {
        return updater(reply);
      }

      if (reply.children && reply.children.length > 0) {
        return {
          ...reply,
          children: updateRepliesTree(reply.children, replyId, updater),
        };
      }

      return reply;
    });
  };

  const removeReplyFromTree = (replyList, targetId) => {
    let removed = false;
    const filteredReplies = replyList
      .filter((reply) => {
        if (reply._id === targetId) {
          removed = true;
          return false;
        }
        return true;
      })
      .map((reply) => {
        if (reply.children && reply.children.length > 0) {
          const result = removeReplyFromTree(reply.children, targetId);
          if (result.removed) {
            removed = true;
            return { ...reply, children: result.replies };
          }
        }
        return reply;
      });

    return { replies: filteredReplies, removed };
  };

  const collectReplyIds = (replyNode) => {
    if (!replyNode) return [];
    const ids = [replyNode._id];
    if (Array.isArray(replyNode.children)) {
      replyNode.children.forEach((child) => {
        ids.push(...collectReplyIds(child));
      });
    }
    return ids;
  };

  const insertNestedReply = (replyList, parentId, newReply) => {
    let inserted = false;

    const updatedReplies = replyList.map((reply) => {
      if (reply._id === parentId) {
        inserted = true;
        const children = Array.isArray(reply.children) ? reply.children : [];
        return {
          ...reply,
          children: [newReply, ...children],
        };
      }

      if (reply.children && reply.children.length > 0) {
        const childResult = insertNestedReply(reply.children, parentId, newReply);
        if (childResult.inserted) {
          inserted = true;
          return {
            ...reply,
            children: childResult.replies,
          };
        }
      }

      return reply;
    });

    return { replies: updatedReplies, inserted };
  };

  const getMediaUrl = () => {
    const mediaSource =
      isRepost && originalPost ? originalPost.media : post.media;
    if (!mediaSource) return null;
    const path =
      typeof mediaSource === "string" ? mediaSource : mediaSource?.url;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    
    // Utiliser getImageUrl pour gérer correctement les URLs en production
    return getImageUrl(path, "media");
  };

  const getMediaType = () => {
    const mediaSource =
      isRepost && originalPost ? originalPost.media : post.media;
    const url =
      typeof mediaSource === "string" ? mediaSource : mediaSource?.url;
    if (!url) return null;
    if (url.match(/\.(mp4|webm|ogg)$/i)) return "video";
    if (url.match(/youtube|youtu\.be|vimeo/i)) return "video";
    return "image";
  };

  const isYouTubeVideo = () => {
    const url = getMediaUrl();
    return url && url.match(/youtube|youtu\.be/i);
  };

  const getYouTubeEmbedUrl = () => {
    const url = getMediaUrl();
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleLikeClick = async () => {
    if (!ensureLoggedIn("Veuillez vous connecter pour aimer")) {
      return;
    }
    const token = localStorage.getItem("token");

    const postIdForAction =
      isRepost && originalPost ? originalPost._id : post._id;
    const currentIsLiked =
      isRepost && originalPost ? originalPost.isLiked : isLiked;
    const currentLikesCount =
      isRepost && originalPost ? originalPost.likesCount : likesCount;

    const endpoint = currentIsLiked ? "unlike" : "like";
    const res = await fetch(
      `${API_URL}/threads/${postIdForAction}/${endpoint}`,
      {
        method: currentIsLiked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();

    if (data.success) {
      const newIsLiked = !currentIsLiked;
      const newLikesCount =
        data.data.likesCount ||
        (currentIsLiked ? currentLikesCount - 1 : currentLikesCount + 1);

      if (isRepost && originalPost) {
        onUpdate?.(post._id, {
          ...post,
          repostedFrom: {
            ...originalPost,
            isLiked: newIsLiked,
            likesCount: newLikesCount,
          },
        });
      } else {
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);
        onUpdate?.(post._id, {
          ...post,
          isLiked: newIsLiked,
          likesCount: newLikesCount,
        });
      }
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/threads/${post._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (data.success) {
        onDelete?.(post._id);
      } else {
        showError(data.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDeleteReply = (reply) => {
    setReplyToDelete(reply);
    setShowDeleteReplyModal(true);
  };

  const confirmDeleteReply = async () => {
    if (!replyToDelete) return;
    setShowDeleteReplyModal(false);
    setIsDeletingReply(true);
    try {
      const response = await fetch(
        `${API_URL}/replies/${replyToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setReplies((prevReplies) => {
          const result = removeReplyFromTree(prevReplies, replyToDelete._id);
          return result.replies;
        });

        const idsToRemove = collectReplyIds(replyToDelete);
        setReplyLikes((prev) => {
          const next = { ...prev };
          idsToRemove.forEach((id) => {
            delete next[id];
          });
          return next;
        });

        if (!replyToDelete.parentReply) {
          if (isRepost && originalPost) {
            onUpdate?.(post._id, {
              ...post,
              repostedFrom: {
                ...originalPost,
                repliesCount: Math.max(0, (originalPost.repliesCount || 0) - 1),
              },
            });
          } else {
            onUpdate?.(post._id, {
              ...post,
              repliesCount: Math.max(0, (post.repliesCount || 0) - 1),
            });
          }
        }

        success("✓ Commentaire supprimé");
      } else {
        showError(data.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete reply error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setIsDeletingReply(false);
      setReplyToDelete(null);
    }
  };

  const handleEdit = () => setShowEditModal(true);

  // ✅ CHARGER LES RÉPONSES AU MONTAGE
  useEffect(() => {
    if (showReplies && post._id) {
      fetchReplies();
    }
  }, [showReplies, post._id]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const targetThreadId = post._id;
      const response = await fetch(`${API_URL}/replies/${targetThreadId}`);
      const data = await response.json();
    if (data.success) {
      const repliesArray = data.data.replies || data.data || [];
      const topLevelReplies = Array.isArray(repliesArray)
        ? repliesArray.filter((reply) => !reply.parentReply)
        : [];
      setReplies(topLevelReplies);

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (token && userId && Array.isArray(repliesArray)) {
          const likesMap = {};
          // ✅ Aplatir aussi les enfants
          const flattenReplies = (replyList) => {
            replyList.forEach((reply) => {
              if (reply.likes && reply.likes.includes(userId)) {
                likesMap[reply._id] = true;
              }
              if (reply.children && Array.isArray(reply.children)) {
                flattenReplies(reply.children);
              }
            });
          };
          flattenReplies(repliesArray);
          setReplyLikes(likesMap);
        }
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (!focusReplyId || !showReplies) {
      setAutoExpandReplyIds(new Set());
      return;
    }

    const path = findReplyPath(replies, focusReplyId);
    if (path) {
      setAutoExpandReplyIds(new Set(path));
    }
  }, [focusReplyId, showReplies, replies]);

  useEffect(() => {
    if (!focusReplyId || !showReplies) return;
    if (replyScrollRef.current === focusReplyId) return;

    const target = document.getElementById(`reply-${focusReplyId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      replyScrollRef.current = focusReplyId;
    }
  }, [focusReplyId, showReplies, replies, autoExpandReplyIds]);

  const handleUpdatePost = (_postId, updatedData) => {
    onUpdate?.(_postId, updatedData);
    setShowEditModal(false);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!ensureLoggedIn("Veuillez vous connecter pour commenter")) {
      return;
    }
    const token = localStorage.getItem("token");

    if (!newReply || !newReply.trim()) {
      showError("Le contenu est requis");
      return;
    }

    try {
      setReplyLoading(true);
      const targetThreadId = post._id;
      const response = await fetch(`${API_URL}/replies/${targetThreadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newReply.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setReplies((prevReplies) => [data.data, ...prevReplies]);
        setNewReply("");
        success("✓ Réponse envoyée");

        onUpdate?.(post._id, {
          ...post,
          repliesCount: (post.repliesCount || 0) + 1,
        });
      } else {
        showError(data.message || "Erreur lors de la création de la réponse");
      }
    } catch (error) {
      console.error("Reply error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleRepost = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (currentUserId && displayAuthor._id === currentUserId) {
      showError("Tu ne peux pas reposter tes propres posts");
      return;
    }

    try {
      setRepostLoading(true);
      const method = isReposted ? "DELETE" : "POST";
      const postIdToRepost =
        isRepost && originalPost ? originalPost._id : post._id;

      const response = await fetch(
        `${API_URL}/threads/${postIdToRepost}/repost`,
        {
          method,
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        const newIsReposted = !isReposted;
        const newRepostsCount = isReposted
          ? repostsCount - 1
          : repostsCount + 1;

        setIsReposted(newIsReposted);
        setRepostsCount(newRepostsCount);

        success(newIsReposted ? "✓ Thread reposté" : "✓ Repost annulé");

        // Mise à jour du post actuel
        if (isRepost && originalPost) {
          onUpdate?.(post._id, {
            ...post,
            isReposted: newIsReposted,
            repostedFrom: {
              ...originalPost,
              repostsCount: newRepostsCount,
            },
          });
        } else {
          onUpdate?.(post._id, {
            ...post,
            isReposted: newIsReposted,
            repostsCount: newRepostsCount,
          });
        }

        window.location.reload();
      } else {
        const alreadyReposted =
          data?.message?.includes("déjà") || data?.message?.includes("Déjà");
        if (alreadyReposted) {
          success("✓ Déjà reposté");
          return;
        }
        showError(data.message || "Erreur lors du repost");
      }
    } catch (error) {
      console.error("Repost error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setRepostLoading(false);
    }
  };
  const handleFollow = async () => {
    if (!currentUserId || isAuthor) return;

    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");
      const endpoint = isFollowing ? "unfollow" : "follow";
      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(
        `${API_URL}/follows/${displayAuthor._id}/${endpoint}`,
        {
          method: method,
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      const alreadyFollowing =
        data?.message?.includes("déjà") || data?.message?.includes("Déjà");

      if ((response.ok && data.success) || alreadyFollowing) {
        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);

        const followUpdateMeta = {
          _followUpdate: {
            authorId: displayAuthor._id?.toString(),
            isFollowing: newIsFollowing,
          },
        };

        if (isRepost && originalPost) {
          onUpdate?.(post._id, {
            ...post,
            repostedFrom: {
              ...originalPost,
              author: {
                ...originalPost.author,
                isFollowing: newIsFollowing,
              },
            },
            ...followUpdateMeta,
          });
        } else {
          onUpdate?.(post._id, {
            ...post,
            author: {
              ...post.author,
              isFollowing: newIsFollowing,
            },
            ...followUpdateMeta,
          });
        }
      } else {
        showError(data.message || "Erreur lors de l'action");
      }
    } catch (err) {
      console.error("Error following user:", err);
      showError("Erreur de connexion");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReplyLike = async (replyId) => {
    if (!ensureLoggedIn("Veuillez vous connecter pour aimer")) {
      return;
    }
    const token = localStorage.getItem("token");

    try {
      const isCurrentlyLiked = replyLikes[replyId] || false;
      const endpoint = isCurrentlyLiked ? "unlike" : "like";
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      const url = `${API_URL}/replies/${replyId}/${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const apiLikesCount =
          typeof data?.data?.likesCount === "number"
            ? data.data.likesCount
            : typeof data?.likesCount === "number"
              ? data.likesCount
              : null;

        setReplyLikes((prevLikes) => ({
          ...prevLikes,
          [replyId]: !isCurrentlyLiked,
        }));

        setReplies((prevReplies) =>
          updateRepliesTree(prevReplies, replyId, (reply) => {
            const currentLikesCount =
              typeof reply.likesCount === "number"
                ? reply.likesCount
                : Array.isArray(reply.likes)
                  ? reply.likes.length
                  : 0;
            const nextLikesCount =
              typeof apiLikesCount === "number"
                ? apiLikesCount
                : currentLikesCount + (isCurrentlyLiked ? -1 : 1);

            return {
              ...reply,
              likesCount: Math.max(0, nextLikesCount),
            };
          }),
        );
        success(isCurrentlyLiked ? "✓ Like retiré" : "✓ Réponse aimée");
      } else {
        showError(data.message || "Erreur lors du like");
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      showError("Erreur de connexion au serveur");
    }
  };

  const handleReplyRepost = async (replyId) => {
    if (!ensureLoggedIn("Veuillez vous connecter pour reposter")) {
      return;
    }
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/replies/${replyId}/repost`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        success("✓ Commentaire reposté");
        window.location.reload();
      } else {
        showError(data.message || "Erreur lors du repost du commentaire");
      }
    } catch (error) {
      console.error("Error reposting reply:", error);
      showError("Erreur de connexion au serveur");
    }
  };

  const fetchPostLikes = async () => {
    const targetThreadId =
      isRepost && originalPost ? originalPost._id : post._id;
    try {
      setPostLikesLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(
        `${API_URL}/threads/${targetThreadId}/likes`,
        { headers },
      );
      const data = await response.json();
      if (data.success) {
        setPostLikesUsers(data.data?.users || []);
      } else {
        setPostLikesUsers([]);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
      setPostLikesUsers([]);
    } finally {
      setPostLikesLoading(false);
    }
  };

  const handlePostLikesClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPostLikesModal(true);
    await fetchPostLikes();
  };

  const handleNestedReplySubmit = async (e, parentReplyId) => {
    e.preventDefault();
    const replyText = nestedReplyText[parentReplyId];
    if (!ensureLoggedIn("Veuillez vous connecter pour commenter")) {
      return;
    }
    const token = localStorage.getItem("token");

    if (!replyText || !replyText.trim()) {
      showError("Le contenu est requis");
      return;
    }

    try {
      setNestedReplyLoading((prevLoading) => ({
        ...prevLoading,
        [parentReplyId]: true,
      }));

      const targetThreadId = post._id;

      const response = await fetch(`${API_URL}/replies/${targetThreadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentReplyId: parentReplyId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReplies((prevReplies) => {
          const result = insertNestedReply(
            prevReplies,
            parentReplyId,
            data.data,
          );
          return result.inserted ? result.replies : [data.data, ...prevReplies];
        });

        setNestedReplyText((prevText) => ({
          ...prevText,
          [parentReplyId]: "",
        }));
        setExpandedReplyId(null);
        success("✓ Réponse envoyée");

        if (isRepost && originalPost) {
          onUpdate?.(post._id, {
            ...post,
            repostedFrom: {
              ...originalPost,
              repliesCount: (originalPost.repliesCount || 0) + 1,
            },
          });
        } else {
          onUpdate?.(post._id, {
            ...post,
            repliesCount: (post.repliesCount || 0) + 1,
          });
        }
      } else {
        showError(data.message || "Erreur lors de la création de la réponse");
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setNestedReplyLoading((prevLoading) => ({
        ...prevLoading,
        [parentReplyId]: false,
      }));
    }
  };

  const mediaUrl = getMediaUrl();
  const mediaType = getMediaType();
  const displayLikesCount =
    isRepost && originalPost ? originalPost.likesCount : likesCount;
  const displayIsLiked =
    isRepost && originalPost ? originalPost.isLiked : isLiked;
  const displayRepliesCount =
    isRepost && originalPost ? originalPost.repliesCount : post.repliesCount;
  const displayRepostsCount =
    isRepost && originalPost ? originalPost.repostsCount : repostsCount;
  const displayContent =
    isRepost && originalPost ? originalPost.content : post.content;
  const repostLegacyMatch =
    !isRepost &&
    typeof displayContent === "string" &&
    displayContent.match(/^Repost de @([A-Za-z0-9_]+)\s*:?\s*(.*)$/i);
  const repostLegacyUsername = repostLegacyMatch?.[1];
  const repostLegacyText = repostLegacyMatch?.[2] || "";

  const renderContentWithMentions = (content) => {
    if (!content || typeof content !== "string") return content;
    const parts = content.split(/(@[A-Za-z0-9_]+)/g);
    return parts.map((part, index) => {
      if (!part) return null;
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <Link
            key={`mention-${username}-${index}`}
            to={`/profile/${username}`}
            className="mention-chip"
          >
            <img
              src={
                getImageUrl(null, "avatar", username) || "/placeholder.svg"
              }
              className="mention-avatar"
              alt={username || "user"}
              onError={(e) => {
                e.target.src = getImageUrl(null, "avatar", username);
              }}
            />
            <span className="mention-text">{username}</span>
          </Link>
        );
      }
      return <span key={`text-${index}`}>{part}</span>;
    });
  };

  return (
    <div
      id={`post-${post._id}`}
      data-thread-id={post._id}
      data-reposted-from-id={post.repostedFrom?._id}
      className={`post-card ${isRepost ? "repost-card" : ""}`}
    >
      {isRepost && (
        <div className="repost-indicator">
          <img
            src={
              getImageUrl(
                author.profilePicture,
                "avatar",
                author.username,
              ) || "/placeholder.svg"
            }
            className="repost-indicator-avatar"
            alt={author.username || "user"}
            onError={(e) => {
              e.target.src = getImageUrl(null, "avatar", author.username);
            }}
          />
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="repost-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{author.name || author.username} a republié</span>
        </div>
      )}

      {!isRepost && (
        <div className="post-header">
          <Link
            to={
              isAuthor
                ? "/dashboard/profile"
                : `/profile/${displayAuthor.username}`
            }
            className="post-author"
          >
            <img
              src={
                getImageUrl(
                  displayAuthor.profilePicture,
                  "avatar",
                  displayAuthor.username,
                ) || "/placeholder.svg"
              }
              className="post-avatar"
              alt={displayAuthor.username}
            />
            <div>
              <strong>{displayAuthor.name || displayAuthor.username}</strong>
              <div className="post-author-username">
                @{displayAuthor.username}
              </div>
            </div>
          </Link>

          <div className="post-header-actions">
            {currentUserId && !isAuthor && showFollowButton && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`follow-btn ${isFollowing ? "following" : ""}`}
              >
                {followLoading
                  ? "..."
                  : isFollowing
                    ? "Se désabonner"
                    : "S'abonner"}
              </button>
            )}
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      )}

      {isRepost && originalPost ? (
        <div className="repost-content-card">
          <div className="repost-content-header">
            <Link
              to={
                isAuthor
                  ? "/dashboard/profile"
                  : `/profile/${originalPost.author?.username}`
              }
              className="repost-content-author-link"
            >
              <img
                src={
                  getImageUrl(
                    originalPost.author?.profilePicture,
                    "avatar",
                    originalPost.author?.username,
                  ) || "/placeholder.svg"
                }
                className="repost-content-avatar"
                alt={originalPost.author?.username || "user"}
                onError={(e) => {
                  e.target.src = getImageUrl(
                    null,
                    "avatar",
                    originalPost.author?.username,
                  );
                }}
              />
              <div className="repost-content-author">
                <span className="repost-content-name">
                  {originalPost.author?.name || originalPost.author?.username}
                </span>
              </div>
            </Link>
            <div className="repost-content-meta">
              {currentUserId && !isAuthor && showFollowButton && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`follow-btn repost-follow-btn ${
                    isFollowing ? "following" : ""
                  }`}
                >
                  {followLoading
                    ? "..."
                    : isFollowing
                      ? "Se désabonner"
                      : "S'abonner"}
                </button>
              )}
              <span className="post-time">
                {formatDate(originalPost.createdAt)}
              </span>
            </div>
          </div>
            {renderContentWithMentions(originalPost.content || displayContent)}
          
          {mediaUrl && (
            <div className="post-media repost-media">
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
                <img
                  src={mediaUrl}
                  className="post-media-img"
                  alt="Post content"
                  onError={handleImageError}
                />
              ) : (
                <video src={mediaUrl} controls className="post-media-video" />
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {repostLegacyMatch ? (
            <div className="post-content post-content-legacy-repost">
              <div className="legacy-repost-header">
                <span className="legacy-repost-label">Repost de</span>
                {repostLegacyUsername ? (
                  <Link
                    to={`/profile/${repostLegacyUsername}`}
                    className="legacy-repost-link"
                  >
                    <img
                      src={
                        getImageUrl(null, "avatar", repostLegacyUsername) ||
                        "/placeholder.svg"
                      }
                      className="legacy-repost-avatar"
                      alt={repostLegacyUsername || "user"}
                    />
                    <span className="legacy-repost-name">
                      {repostLegacyUsername}
                    </span>
                  </Link>
                ) : (
                  <>
                    <img
                      src="/placeholder.svg"
                      className="legacy-repost-avatar"
                      alt="user"
                    />
                    <span className="legacy-repost-name">Utilisateur</span>
                  </>
                )}
              </div>
              {repostLegacyText && (
                <div className="legacy-repost-text">
                  {renderContentWithMentions(repostLegacyText)}
                </div>
              )}
            </div>
          ) : (
            <div className="post-message">
              {renderContentWithMentions(displayContent)}
            </div>
          )}
        </>
      )}

      {mediaUrl && !isRepost && (
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
            <img 
              src={mediaUrl} 
              className="post-media-img" 
              alt="Post content" 
              onError={handleImageError} 
            />
          ) : (
            <video src={mediaUrl} controls className="post-media-video" />
          )}
        </div>
      )}

      <div className="post-actions">
        <button
          onClick={handleLikeClick}
          className={`action-btn ${displayIsLiked ? "liked" : ""}`}
        >
          <svg
            className="action-icon"
            fill={displayIsLiked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span
            className="action-count action-count-clickable"
            onClick={handlePostLikesClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handlePostLikesClick(e);
              }
            }}
          >
            {displayLikesCount || 0}
          </span>
        </button>

        <button
          onClick={() => {
            if (!ensureLoggedIn("Veuillez vous connecter pour commenter")) {
              return;
            }
            setExpandedReplyId(null);
            setShowReplies((prev) => !prev);
          }}
          className={`action-btn ${showReplies ? "active" : ""}`}
        >
          <svg
            className="action-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="action-count">{displayRepliesCount || 0}</span>
        </button>

        {!isAuthor && (
          <button
            onClick={handleRepost}
            disabled={repostLoading}
            className={`action-btn ${isReposted ? "reposted" : ""}`}
          >
            <svg
              className="action-icon"
              fill={isReposted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="action-count">{displayRepostsCount || 0}</span>
          </button>
        )}

        {isAuthor && !isRepost && (
          <div className="author-actions">
            <button onClick={handleEdit} className="action-btn edit-btn">
              <svg
                className="action-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="action-btn delete-btn"
            >
              <svg
                className="action-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
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
                src={getImageUrl(
                  effectiveCurrentUser?.profilePicture,
                  "avatar",
                  effectiveCurrentUser?.username || "User",
                )}
                alt="Votre avatar"
                className="reply-avatar-img"
                onError={(e) => {
                  e.target.src = getImageUrl(
                    null,
                    "avatar",
                    effectiveCurrentUser?.username || "User",
                  );
                }}
              />
            </div>
            <form onSubmit={handleReplySubmit} className="reply-form">
              <div className="reply-input-wrapper">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => {
                    const token = localStorage.getItem("token");
                    if (!token) return;
                    setNewReply(e.target.value);
                  }}
                  onFocus={() => {
                    ensureLoggedIn("Veuillez vous connecter pour commenter");
                  }}
                  onClick={() => {
                    ensureLoggedIn("Veuillez vous connecter pour commenter");
                  }}
                  placeholder="Écrire une réponse..."
                  className="reply-input"
                />
                <button
                  type="submit"
                  disabled={!newReply.trim() || replyLoading}
                  className="reply-submit-btn"
                >
                  {replyLoading ? (
                    <svg
                      className="loading-spinner"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="spinner-path"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
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
                <NestedReply
                  key={`${reply._id}-${repliesVersion}`}
                  reply={reply}
                  onLike={handleReplyLike}
                  onReply={handleNestedReplySubmit}
                  currentUserId={currentUserId}
                  expandedReplyId={expandedReplyId}
                  setExpandedReplyId={setExpandedReplyId}
                  nestedReplyText={nestedReplyText}
                  setNestedReplyText={setNestedReplyText}
                  nestedReplyLoading={nestedReplyLoading}
                  isMyReply={isMyReply}
                  formatDate={formatDate}
                  replyLikes={replyLikes}
                  collapseSignal={repliesVersion}
                  autoExpandReplyIds={autoExpandReplyIds}
                  apiUrl={API_URL}
                  onRepost={handleReplyRepost}
                  onDelete={requestDeleteReply}
                  childReplies={reply.children || []}
                />
              ))
            ) : (
              <div className="no-replies">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>Soyez le premier à répondre</p>
              </div>
            )}
          </div>
        </div>
      )}

      <LikesModal
        isOpen={showPostLikesModal}
        title="J'aime"
        users={postLikesUsers}
        loading={postLikesLoading}
        onClose={() => setShowPostLikesModal(false)}
      />

      <ConfirmModal
        isOpen={showLoginModal}
        title="Connexion requise"
        message={loginModalMessage || "Veuillez vous connecter pour continuer."}
        confirmText="Se connecter"
        cancelText="Annuler"
        onConfirm={() => {
          setShowLoginModal(false);
          navigate("/login");
        }}
        onCancel={() => setShowLoginModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteReplyModal}
        title="Supprimer le commentaire"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible."
        confirmText={isDeletingReply ? "Suppression..." : "Supprimer"}
        cancelText="Annuler"
        onConfirm={confirmDeleteReply}
        onCancel={() => {
          if (isDeletingReply) return;
          setShowDeleteReplyModal(false);
          setReplyToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le post"
        message="Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <EditPostModal
        isOpen={showEditModal}
        post={post}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdatePost}
      />
    </div>
  );
};

export default PostCard;
