"use client";

import { useNavigate } from "react-router-dom";
import { useCreatePostModal } from "../contexts/CreatePostModalContext";
import CreatePost from "./CreatePost";
import "../styles/CreatePostModal.css";

export default function CreatePostModal() {
  const { isOpen, closeModal } = useCreatePostModal();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePostCreated = () => {
    closeModal();
    navigate("/dashboard/posts");
  };

  return (
    <div className="create-post-modal-overlay" onClick={closeModal}>
      <div
        className="create-post-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-post-modal-header">
          <h3>Nouveau thread</h3>
          <button
            type="button"
            className="create-post-modal-close"
            onClick={closeModal}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="create-post-modal-body">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
      </div>
    </div>
  );
}
