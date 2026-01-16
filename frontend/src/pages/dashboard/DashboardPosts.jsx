//frontend/src/pages/dashboard/DashboardPosts.jsx
"use client";

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import CreatePost from "../../components/CreatePost";
import Feed from "../../components/Feed";
import "../../styles/Dashboard.css";

export default function DashboardPosts() {
  const { user } = useOutletContext();
  const [newPost, setNewPost] = useState(null);

  const handlePostCreated = (post) => {
    console.log("New post created:", post); // Debug log
    setNewPost(post);
    // Reset after a longer delay to ensure Feed processes the new post
    setTimeout(() => setNewPost(null), 500);
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Posts</h1>
        <p className="dashboard-subtitle">
          Partagez vos moments avec la communauté
        </p>
      </div>

      <CreatePost onPostCreated={handlePostCreated} />
      <Feed newPost={newPost} type="home" paginationType="traditional" />
    </div>
  );
}
