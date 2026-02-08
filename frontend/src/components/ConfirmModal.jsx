import "../styles/Modal.css";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Annuler",
  isDangerous = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className={`modal-content ${
          isDangerous ? "modal-content-danger" : "modal-content-confirm"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon" aria-hidden="true">
            {isDangerous ? (
              <svg fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 8v5M12 16h.01M10.29 3.86l-8.4 14.55a1.5 1.5 0 0 0 1.3 2.25h17.62a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-3.42 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 6v6m0 6h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>
          <div className="modal-header-text">
            <h2 className="modal-title">{title}</h2>
            <p className="modal-subtitle">
              {isDangerous
                ? "Cette action est irréversible."
                : "Veuillez confirmer votre action."}
            </p>
          </div>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button
            className="modal-button modal-button-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`modal-button ${
              isDangerous ? "modal-button-danger" : "modal-button-confirm"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
