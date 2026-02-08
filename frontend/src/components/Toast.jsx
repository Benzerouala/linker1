import { useToastContext } from "../contexts/ToastContext";
import "../styles/Toast.css";

export default function Toast() {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-content">
            {toast.type === "success" && <span className="toast-icon">✓</span>}
            {toast.type === "error" && <span className="toast-icon">✕</span>}
            {toast.type === "warning" && <span className="toast-icon">⚠</span>}
            {toast.type === "info" && <span className="toast-icon">ℹ</span>}
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-progress"></div>
        </div>
      ))}
    </div>
  );
}
