import { useState } from "react";
import { useToastContext } from "../contexts/ToastContext";
import "../styles/EditPostModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function EditPostModal({ isOpen, post, onClose, onUpdate }) {
  const { success, error: showError } = useToastContext();
  const [editContent, setEditContent] = useState(post?.content || "");
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editContent.trim()) {
      showError("Le contenu du post ne peut pas être vide");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("content", editContent);

      if (editMediaFile) {
        formData.append("media", editMediaFile);
      }

      const response = await fetch(`${API_URL}/threads/${post._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        success("Post mis à jour avec succès");
        onUpdate?.(post._id, data.data);
        setEditContent("");
        setEditMediaFile(null);
        onClose();
      } else {
        showError(data.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Erreur de connexion au serveur");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2>Modifier le post</h2>
          <button
            className="edit-modal-close"
            onClick={onClose}
            type="button"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdate} className="edit-modal-form">
          <div className="edit-modal-textarea-wrapper">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-modal-textarea"
              placeholder="Modifiez le contenu de votre post..."
              autoFocus
            />
          </div>

          <div className="edit-modal-media">
            <label htmlFor="edit-media" className="edit-media-label">
              📎 Changer l'image/vidéo
            </label>
            <input
              id="edit-media"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setEditMediaFile(e.target.files[0])}
              className="hidden"
            />
            {editMediaFile && (
              <span className="file-selected">✓ {editMediaFile.name}</span>
            )}
          </div>

          <div className="edit-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="edit-modal-button cancel"
              disabled={isUpdating}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="edit-modal-button confirm"
              disabled={isUpdating || !editContent.trim()}
            >
              {isUpdating ? "Mise à jour..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
