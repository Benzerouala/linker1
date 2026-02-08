"use client";

import { useState, useRef, useEffect } from "react";
import { useLocation, useOutletContext, useParams } from "react-router-dom";
import CreatePost from "../../components/CreatePost";
import Feed from "../../components/Feed";
import "../../styles/Dashboard.css";

export default function DashboardPosts() {
  const { user } = useOutletContext();
  const { id } = useParams();
  const [newPost, setNewPost] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const feedRef = useRef(null);
  const location = useLocation();
  const [focusState, setFocusState] = useState(null);

  useEffect(() => {
    if (location.state?.focusThreadId) {
      setFocusState({
        threadId: location.state.focusThreadId,
        replyId: location.state.focusReplyId || null,
        type: location.state.focusType || null,
        timestamp: Date.now(),
      });
    }
  }, [location.state]);

  const handlePostCreated = (post) => {
    console.log("New post created:", post);
    setNewPost(post);
    setRefreshKey((prev) => prev + 1);
    
    // Faire défiler vers le haut après un court délai pour que le post soit ajouté
    setTimeout(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = 0; // Scroll vers le haut pour voir le nouveau post
      }
      setNewPost(null);
    }, 300);
  };

  return (
    <div className="dashboard-content">
      {!id && <CreatePost onPostCreated={handlePostCreated} />}
      <Feed
        ref={feedRef}
        newPost={newPost}
        refreshKey={refreshKey}
        type={id ? "specific" : "home"}
        postId={id}
        paginationType="traditional"
        focusThreadId={focusState?.threadId}
        focusReplyId={focusState?.replyId}
        focusType={focusState?.type}
        currentUser={user}
      />
    </div>
  );
}