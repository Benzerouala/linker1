"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./PostCard";
import { useSocket } from "../contexts/SocketContext";
import "../styles/Feed.css";

const Feed = ({
  newPost,
  type = "explore",
  itemsPerPage = 10,
  postId = null,
  focusThreadId = null,
  focusReplyId = null,
  focusType = null,
  refreshKey = 0,
  currentUser = null,
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [newContentCount, setNewContentCount] = useState(0);

  const observerTarget = useRef(null);
  const fetchedFocusRef = useRef(new Set());
  const scrolledFocusRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const currentUserId = localStorage.getItem("userId");
  const { socket, connected } = useSocket();

  const fetchPosts = useCallback(async (pageNum = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      let endpoint = type === "home" ? "threads/feed" : "threads";

      if (type === "specific" && postId) {
        endpoint = `threads/${postId}`;
      }

      const url =
        type === "specific"
          ? `${API_URL}/${endpoint}`
          : `${API_URL}/${endpoint}?page=${pageNum}&limit=${itemsPerPage}`;

      const response = await fetch(url, { method: "GET", headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Erreur serveur (${response.status})`,
        }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (type === "specific") {
          setPosts([data.data]);
          setHasMore(false);
        } else {
          const paginationData = data.data.pagination || {
            hasMore: false,
          };

          if (pageNum === 1) {
            setPosts(data.data.threads);
            setHasNewContent(false);
            setNewContentCount(0);
          } else {
            setPosts((prev) => {
              const newPosts = data.data.threads.filter(
                (post) => !prev.find((p) => p._id === post._id)
              );
              return [...prev, ...newPosts];
            });
          }
          
          setHasMore(paginationData.hasMore);
          setPage(pageNum);
        }
        setError("");
      } else {
        setError(data.message || "Erreur lors du chargement des posts");
      }
    } catch (err) {
      const isNetworkError = err.message.includes("fetch");
      const errorMessage = isNetworkError
        ? `Impossible de se connecter au serveur (${API_URL}). Vérifiez que le backend est démarré.`
        : err.message || "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors du chargement des posts:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [type, postId, itemsPerPage, API_URL]);

  // Chargement automatique au scroll (infinite scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  // Chargement initial
  useEffect(() => {
    setPage(1);
    setPosts([]);
    setLoading(true);
    fetchPosts(1, false);
  }, [type, postId, refreshKey, fetchPosts]);

  // Nouveau post ajouté
  useEffect(() => {
    if (newPost) {
      setPosts((prev) => {
        const exists = prev.some((post) => post._id === newPost._id);
        if (!exists) {
          return [newPost, ...prev];
        }
        return prev;
      });
    }
  }, [newPost]);

  // Mise à jour temps réel (likes, réponses) quand quelqu'un interagit avec nos posts
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = (event) => {
      const data = event.data || {};
      const { threadId, likesCount, repliesCount, repostsCount } = data;
      if (!threadId) return;
      const updates = {};
      if (likesCount !== undefined) updates.likesCount = likesCount;
      if (repliesCount !== undefined) updates.repliesCount = repliesCount;
      if (repostsCount !== undefined) updates.repostsCount = repostsCount;
      if (Object.keys(updates).length === 0) return;
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === threadId) return { ...p, ...updates };
          if (p.repostedFrom?._id === threadId) {
            return { ...p, repostedFrom: { ...p.repostedFrom, ...updates } };
          }
          return p;
        }),
      );
    };
    socket.on("thread_update", handler);
    return () => socket.off("thread_update", handler);
  }, [socket, connected]);

  // Nouvelle notification reçue → afficher "Actualiser le fil" (style Facebook)
  useEffect(() => {
    if (!socket || !connected || type === "specific") return;
    const handler = () => {
      setHasNewContent(true);
      setNewContentCount((c) => c + 1);
    };
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket, connected, type]);

  const handleRefreshNewContent = () => {
    setHasNewContent(false);
    setNewContentCount(0);
    setPage(1);
    setLoading(true);
    fetchPosts(1, false);
  };

  useEffect(() => {
    if (!focusThreadId || type === "specific") return;

    const hasFocusPost = posts.some(
      (post) =>
        post._id === focusThreadId ||
        post.repostedFrom?._id === focusThreadId,
    );

    if (hasFocusPost || fetchedFocusRef.current.has(focusThreadId)) {
      return;
    }

    const fetchFocusPost = async () => {
      try {
        fetchedFocusRef.current.add(focusThreadId);
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const response = await fetch(`${API_URL}/threads/${focusThreadId}`, {
          method: "GET",
          headers,
        });
        const data = await response.json();
        if (data.success) {
          setPosts((prev) => {
            if (prev.some((post) => post._id === data.data._id)) {
              return prev;
            }
            return [data.data, ...prev];
          });
        }
      } catch (error) {
        console.error("Error fetching focus post:", error);
      }
    };

    fetchFocusPost();
  }, [focusThreadId, type, posts, API_URL]);

  useEffect(() => {
    if (!focusThreadId || loading) return;
    const scrollKey = `${focusThreadId}:${focusReplyId || ""}`;
    if (scrolledFocusRef.current === scrollKey) return;

    const target =
      document.getElementById(`post-${focusThreadId}`) ||
      document.querySelector(`[data-reposted-from-id="${focusThreadId}"]`);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledFocusRef.current = scrollKey;
    }
  }, [focusThreadId, focusReplyId, posts, loading]);

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  const applyFollowUpdate = (post, authorId, isFollowing) => {
    const isRepost = !!post.repostedFrom;
    const displayAuthor =
      isRepost && post.repostedFrom?.author ? post.repostedFrom.author : post.author;

    if (!displayAuthor || displayAuthor._id?.toString() !== authorId) {
      return post;
    }

    if (isRepost && post.repostedFrom?.author) {
      return {
        ...post,
        repostedFrom: {
          ...post.repostedFrom,
          author: {
            ...post.repostedFrom.author,
            isFollowing,
          },
        },
      };
    }

    if (post.author) {
      return {
        ...post,
        author: {
          ...post.author,
          isFollowing,
        },
      };
    }

    return post;
  };

  const handlePostUpdate = (postId, updatedData) => {
    const followUpdate = updatedData?._followUpdate;
    setPosts((prev) =>
      prev.map((post) => {
        let nextPost = post;
        if (post._id === postId) {
          const { _followUpdate, ...rest } = updatedData || {};
          nextPost = { ...post, ...rest };
        }

        if (followUpdate?.authorId) {
          return applyFollowUpdate(
            nextPost,
            followUpdate.authorId,
            followUpdate.isFollowing,
          );
        }

        return nextPost;
      }),
    );
  };

  if (loading && posts.length === 0) {
    return <div className="feed-loading">Chargement des posts...</div>;
  }

  if (error && posts.length === 0) {
    return (
      <div className="feed-error">
        <p>{error}</p>
        <button
          onClick={() => fetchPosts(1, false)}
          className="retry-btn"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="feed-empty">
        <p>Aucun post pour le moment</p>
        <p className="feed-empty-subtitle">Soyez le premier à publier !</p>
      </div>
    );
  }

  const getOriginalThreadId = (post) =>
    post?.repostedFrom?._id || post?.repostedFrom || post?._id;

  const getDisplayAuthor = (post) =>
    post?.repostedFrom?.author ? post.repostedFrom.author : post?.author;

  const repostedByMe = new Set();
  posts.forEach((post) => {
    const authorId = post?.author?._id?.toString();
    if (currentUserId && authorId === currentUserId && post?.repostedFrom) {
      const originalId = getOriginalThreadId(post);
      if (originalId) {
        repostedByMe.add(originalId.toString());
      }
    }
  });

  const followMap = new Map();
  posts.forEach((post) => {
    const displayAuthor = getDisplayAuthor(post);
    const authorId = displayAuthor?._id?.toString();
    if (!authorId || typeof displayAuthor?.isFollowing !== "boolean") return;
    if (!followMap.has(authorId)) {
      followMap.set(authorId, displayAuthor.isFollowing);
      return;
    }
    if (displayAuthor.isFollowing) {
      followMap.set(authorId, true);
    }
  });

  return (
    <div className="feed">
      {hasNewContent && (
        <button
          type="button"
          className="feed-new-content-banner"
          onClick={handleRefreshNewContent}
          aria-label="Actualiser le fil"
        >
          <span className="feed-new-content-icon">↻</span>
          <span className="feed-new-content-text">
            {newContentCount > 1
              ? `${newContentCount} nouveaux contenus — Actualiser`
              : "Nouveaux contenus — Actualiser"}
          </span>
        </button>
      )}
      {posts.map((post) => {
        const isFocusPost =
          focusThreadId &&
          (post._id === focusThreadId ||
            post.repostedFrom?._id === focusThreadId);
        const shouldOpenReplies =
          isFocusPost && (focusReplyId || focusType === "thread_reply");

        const originalId = getOriginalThreadId(post);
        const effectiveIsReposted =
          !!post.isReposted ||
          (currentUserId && originalId && repostedByMe.has(originalId.toString()));

        let postForCard = post;
        if (effectiveIsReposted !== post.isReposted) {
          postForCard = { ...postForCard, isReposted: effectiveIsReposted };
        }

        const displayAuthor = getDisplayAuthor(postForCard);
        const displayAuthorId = displayAuthor?._id?.toString();
        const mappedIsFollowing = displayAuthorId
          ? followMap.get(displayAuthorId)
          : undefined;

        if (typeof mappedIsFollowing === "boolean") {
          if (postForCard.repostedFrom?.author) {
            postForCard = {
              ...postForCard,
              repostedFrom: {
                ...postForCard.repostedFrom,
                author: {
                  ...postForCard.repostedFrom.author,
                  isFollowing: mappedIsFollowing,
                },
              },
            };
          } else if (postForCard.author) {
            postForCard = {
              ...postForCard,
              author: {
                ...postForCard.author,
                isFollowing: mappedIsFollowing,
              },
            };
          }
        }

        return (
          <div key={post._id}>
            <PostCard
              post={postForCard}
              onDelete={handleDelete}
              onUpdate={handlePostUpdate}
              autoOpenReplies={shouldOpenReplies}
              focusReplyId={isFocusPost ? focusReplyId : null}
              currentUser={currentUser}
            />
          </div>
        );
      })}

      {/* Élément observé pour le chargement automatique au scroll */}
      <div ref={observerTarget} className="feed-observer" />

      {loadingMore && (
        <div className="feed-loading-more">
          <div className="spinner"></div>
          Chargement...
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="feed-end">Vous avez vu tous les threads.</div>
      )}
    </div>
  );
};

export default Feed;