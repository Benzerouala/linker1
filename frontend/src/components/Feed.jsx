"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PostCard from "./PostCard"
import Pagination from "./Pagination"
import "../styles/Feed.css"

const Feed = ({ 
  newPost, 
  type = "explore", 
  paginationType = "infinite", // "infinite" or "traditional"
  itemsPerPage = 10 
}) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: true
  })

  const observer = useRef()
  const lastPostElementRef = useCallback(
    (node) => {
      if (paginationType !== "infinite" || loading || loadingMore) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, loadingMore, hasMore, paginationType],
  )

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  const fetchPosts = async (pageNum = 1) => {
    try {
      if (pageNum > 1) setLoadingMore(true)
      const token = localStorage.getItem("token")
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const endpoint = type === "home" ? "threads/feed" : "threads"
      const response = await fetch(`${API_URL}/${endpoint}?page=${pageNum}&limit=${itemsPerPage}`, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Erreur serveur (${response.status})`,
        }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const paginationData = data.data.pagination || {
          currentPage: pageNum,
          totalPages: 1,
          totalThreads: 0,
          hasMore: false
        }

        setPagination({
          currentPage: paginationData.currentPage,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.totalThreads,
          hasMore: paginationData.hasMore
        })

        if (paginationType === "infinite") {
          if (pageNum === 1) {
            setPosts(data.data.threads)
          } else {
            setPosts((prev) => {
              const newPosts = data.data.threads.filter((post) => !prev.find((p) => p._id === post._id))
              return [...prev, ...newPosts]
            })
          }
          setHasMore(paginationData.hasMore)
        } else {
          // Traditional pagination - replace posts
          setPosts(data.data.threads)
          setPage(paginationData.currentPage)
        }
        setError("")
      } else {
        setError(data.message || "Erreur lors du chargement des posts")
      }
    } catch (err) {
      const isNetworkError = err.message.includes("fetch")
      const errorMessage = isNetworkError
        ? `Impossible de se connecter au serveur (${API_URL}). Vérifiez que le backend est démarré.`
        : err.message || "Erreur inconnue"

      setError(errorMessage)
      console.error("Erreur lors du chargement des posts:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchPosts(newPage)
  }

  useEffect(() => {
    if (paginationType === "infinite" && page > 1) {
      fetchPosts(page)
    }
  }, [page, paginationType])

  useEffect(() => {
    setPage(1)
    fetchPosts(1)
  }, [type, paginationType]) // Refetch if feed type or pagination type changes

  // Handle new posts from CreatePost component
  useEffect(() => {
    if (newPost) {
      // Add the new post at the beginning of the posts array
      // Check if post already exists to avoid duplicates
      setPosts((prev) => {
        const exists = prev.some(post => post._id === newPost._id)
        if (!exists) {
          return [newPost, ...prev]
        }
        return prev
      })
    }
  }, [newPost])

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId))
  }

  const handlePostUpdate = (postId, updatedData) => {
    setPosts((prev) => prev.map((post) => (post._id === postId ? { ...post, ...updatedData } : post)))
  }

  if (loading) {
    return <div className="feed-loading">Chargement des posts...</div>
  }

  if (error) {
    return (
      <div className="feed-error">
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            setError("")
            fetchPosts(1)
          }}
          className="retry-btn"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="feed-empty">
        <p>Aucun post pour le moment</p>
        <p className="feed-empty-subtitle">Soyez le premier à publier !</p>
      </div>
    )
  }

  return (
    <div className="feed">
      {posts.map((post, index) => {
        const isLastPost = paginationType === "infinite" && posts.length === index + 1
        return (
          <div 
            key={post._id}
            ref={isLastPost ? lastPostElementRef : null}
          >
            <PostCard post={post} onDelete={handleDelete} onUpdate={handlePostUpdate} />
          </div>
        )
      })}

      {paginationType === "infinite" && loadingMore && (
        <div className="feed-loading-more">Chargement de plus de threads...</div>
      )}

      {paginationType === "infinite" && !hasMore && posts.length > 0 && (
        <div className="feed-end">Vous avez vu tous les threads récents.</div>
      )}

      {paginationType === "traditional" && posts.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default Feed
