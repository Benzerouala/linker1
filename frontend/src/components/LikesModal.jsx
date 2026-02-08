import { getImageUrl } from "../utils/imageHelper";
import "../styles/LikesModal.css";

const LikesModal = ({ isOpen, title, users = [], loading = false, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="likes-modal-overlay" onClick={onClose}>
      <div
        className="likes-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="likes-modal-header">
          <h3>{title}</h3>
          <button className="likes-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="likes-modal-body">
          {loading ? (
            <div className="likes-modal-loading">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="likes-modal-empty">Aucun like pour le moment</div>
          ) : (
            <ul className="likes-modal-list">
              {users.map((user) => (
                <li key={user._id} className="likes-modal-item">
                  <img
                    src={
                      getImageUrl(
                        user.profilePicture,
                        "avatar",
                        user.username,
                      ) || "/placeholder.svg"
                    }
                    alt={user.username}
                    className="likes-modal-avatar"
                  />
                  <div className="likes-modal-user">
                    <div className="likes-modal-name">
                      {user.name || user.username}
                      {user.isVerified && (
                        <span className="likes-modal-verified">✓</span>
                      )}
                    </div>
                    <div className="likes-modal-username">@{user.username}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;
