// backend/src/services/socketService.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket.id
  }

  /**
   * Initialiser Socket.IO
   */
  initialize(server) {
   this.io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  }
});

    // Middleware d'authentification
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Token non fourni"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = String(decoded.id);
        next();
      } catch (error) {
        next(new Error("Token invalide"));
      }
    });

    // Gestion des connexions
    this.io.on("connection", (socket) => {
      console.log(`✅ Socket connecté: user=${socket.userId} (total: ${this.connectedUsers.size + 1})`);

      // Ajouter l'utilisateur à la liste des connectés
      this.connectedUsers.set(socket.userId, socket.id);

      // Rejoindre la room personnelle de l'utilisateur
      socket.join(`user_${socket.userId}`);

      // Envoyer le compteur de notifications non lues
      this.sendUnreadCount(socket.userId);

      // Gérer la déconnexion
      socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Marquer les notifications comme lues
      socket.on("mark_notifications_read", async () => {
        try {
          const Notification = (await import("../models/Notification.js")).default;
          await Notification.updateMany(
            { recipient: socket.userId, isRead: false },
            { isRead: true }
          );
          
          // Envoyer le nouveau compteur
          this.sendUnreadCount(socket.userId);
        } catch (error) {
          console.error("Erreur mark_notifications_read:", error);
        }
      });

      // Rejoindre une room de thread pour les notifications en temps réel
      socket.on("join_thread", (threadId) => {
        socket.join(`thread_${threadId}`);
      });

      // Quitter une room de thread
      socket.on("leave_thread", (threadId) => {
        socket.leave(`thread_${threadId}`);
      });
    });

    console.log("🔌 Socket.IO initialisé");
  }

  /**
   * Normaliser un ID utilisateur (ObjectId, objet { _id }, ou string)
   */
  _normalizeUserId(userId) {
    if (userId == null) return null;
    if (typeof userId === "object" && userId._id != null) return String(userId._id);
    return String(userId);
  }

  /**
   * Convertir un doc Mongoose en objet plain pour envoi Socket (éviter erreurs de sérialisation)
   */
  _toPlainObject(doc) {
    if (!doc) return null;
    if (typeof doc.toObject === "function") return doc.toObject();
    if (typeof doc === "object" && doc !== null) return JSON.parse(JSON.stringify(doc));
    return doc;
  }

  /**
   * Envoyer une notification en temps réel à un utilisateur
   * userId peut être ObjectId, string ou objet avec _id — normalisé pour la room
   */
  sendNotification(userId, notification) {
    const uid = this._normalizeUserId(userId);
    if (!uid || !this.io) return;
    const room = `user_${uid}`;
    const payload = {
      type: "new_notification",
      data: this._toPlainObject(notification),
      timestamp: new Date().toISOString(),
    };
    this.io.to(room).emit("new_notification", payload);
    if (process.env.NODE_ENV !== "production") {
      console.log(`📤 Notification → room ${room} (destinataire connecté: ${this.connectedUsers.has(uid)})`);
    }
  }

  /**
   * Envoyer le compteur de notifications non lues
   */
  async sendUnreadCount(userId) {
    try {
      const uid = this._normalizeUserId(userId);
      if (!uid) return;
      const Notification = (await import("../models/Notification.js")).default;
      const count = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });

      if (this.io) {
        this.io.to(`user_${uid}`).emit("unread_count", {
          type: "unread_count",
          data: { count },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Erreur sendUnreadCount:", error);
    }
  }

  /**
   * Notifier les abonnés d'un nouveau thread
   */
  notifyFollowers(authorId, thread) {
    // Envoyer aux followers de l'auteur
    this.io.to(`followers_${authorId}`).emit("new_thread", {
      type: "new_thread",
      data: thread,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifier une mise à jour de thread en temps réel
   */
  notifyThreadUpdate(threadId, update) {
    this.io.to(`thread_${threadId}`).emit("thread_update", {
      type: "thread_update",
      data: { threadId, ...update },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifier une nouvelle réponse
   */
  notifyNewReply(threadId, reply) {
    this.io.to(`thread_${threadId}`).emit("new_reply", {
      type: "new_reply",
      data: { threadId, reply },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifier un nouveau like
   */
  notifyNewLike(threadId, likeData) {
    this.io.to(`thread_${threadId}`).emit("new_like", {
      type: "new_like",
      data: { threadId, ...likeData },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envoyer une mise à jour de thread à l'auteur (ex: like count) pour affichage temps réel
   * L'auteur reçoit l'événement dans sa room user_${authorId}
   */
  notifyAuthorThreadUpdate(authorId, threadId, update) {
    const uid = this._normalizeUserId(authorId);
    if (!uid || !this.io) return;
    this.io.to(`user_${uid}`).emit("thread_update", {
      type: "thread_update",
      data: { threadId, ...update },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isUserConnected(userId) {
    const uid = this._normalizeUserId(userId);
    return uid != null && this.connectedUsers.has(uid);
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Envoyer une notification système à tous les utilisateurs connectés
   */
  broadcastSystemNotification(message) {
    if (this.io) {
      this.io.emit("system_notification", {
        type: "system_notification",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default new SocketService();
