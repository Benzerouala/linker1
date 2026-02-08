import { useState, useEffect } from "react";
import NotificationsSidebar from "./NotificationsSidebar";
import NotificationToastBottom from "./NotificationToastBottom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NotificationManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
const [socket, setSocket] = useState(null);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn('Aucun token trouvé');
    return;
  }

  const initSocket = async () => {
  try {
    const { io } = await import("socket.io-client");
    const socketInstance = io(API_URL.replace("/api", ""), {
      auth: { 
        token: localStorage.getItem("token") 
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Vérifier que l'instance est bien créée
    if (!socketInstance) {
      throw new Error("Échec de la création de l'instance socket");
    }

    // Gestion des événements de connexion
    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connecté");
      setSocket(socketInstance);
    });

    // Gestion des erreurs de connexion
    socketInstance.on("connect_error", (err) => {
      console.error("Erreur de connexion Socket.IO:", err.message);
    });

    // Gestion des notifications
    socketInstance.on("new_notification", (data) => {
      console.log("🔔 Nouvelle notification reçue:", data);
      if (data && !data.isRead) {
        setCurrentToast(data);
        // Mettre à jour le store ou le contexte global
        window.dispatchEvent(new CustomEvent("newNotification", { detail: data }));
      }
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  } catch (error) {
    console.error("Erreur d'initialisation Socket.IO:", error);
  }
};

  initSocket();
}, []);

  const handleToastClose = () => {
    setCurrentToast(null);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    // Déclencher un événement pour rafraîchir le compteur
    window.dispatchEvent(new Event("newNotification"));
  };

  return (
    <>
      {/* Sidebar de notifications */}
      <NotificationsSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Toast en bas */}
      {currentToast && (
        <NotificationToastBottom
          notification={currentToast}
          onClose={handleToastClose}
        />
      )}
    </>
  );
}
