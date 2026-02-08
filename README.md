# Linker — Plateforme de reseau social web (Projet 2025)

## 1. Presentation generale
Linker est une application web de reseau social basee sur des discussions par threads. La plateforme permet de publier des contenus, d'interagir (likes, reponses, reposts), de gerer la visibilite des comptes (public/prive), et de recevoir des notifications en temps reel et par email.

Objectifs:
- Valider une architecture full stack moderne (SPA + API REST).
- Mettre en place des mecanismes de securite et de scalabilite.
- Produire une documentation technique complete (UML, Gantt, guide de deploiement).

## 2. Perimetre fonctionnel (cahier des charges)
- Authentification complete (inscription, connexion, sessions JWT)
- Comptes publics/prives avec gestion des demandes de suivi
- Profils utilisateurs (photo, bio, stats)
- Threads: creation, reponses, likes, reposts, statistiques
- Fil d'actualite dynamique
- Systemes follow/unfollow
- Notifications in-app, temps reel (Socket.io) et email
- Gestion des medias (uploads)
- Parametres (confidentialite, notifications, preferences)

## 3. Architecture technique
### 3.1 Frontend (SPA)
- React + Vite
- React Router, Context API
- Tailwind CSS / CSS custom
- Socket.io client

### 3.2 Backend (API REST)
- Node.js + Express
- Architecture en couches: routes / controllers / services / models
- MongoDB + Mongoose
- Swagger UI: `/api/docs`

### 3.3 Temps reel & Email
- Socket.io pour les notifications temps reel
- Resend API pour les emails (réinitialisation mot de passe, bienvenue, notifications)

## 4. Stack technique
**Frontend**
- React, Vite, React Router, Axios, Socket.io client
- Tailwind CSS

**Backend**
- Express, Mongoose, JWT, bcrypt
- Helmet, CORS, Rate limit
- Swagger (swagger-jsdoc, swagger-ui-express)
- Resend API, Nodemailer (fallback SMTP)

## 5. Structure du projet
```
ProjetFinal/
  backend/
  frontend/
  README.md
```

## 6. Installation & lancement
### Backend
```
cd backend
npm install
npm run dev
```

### Frontend
```
cd frontend
npm install
npm run dev
```

## 7. Variables d'environnement (exemple)
**Backend (.env)**
```
MONGO_URI=...
JWT_SECRET=...
FRONTEND_URL=http://localhost:5173
EMAIL_SERVICE=resend
EMAIL_PASSWORD=re_xxxxx  # Clé API Resend (commence par re_)
EMAIL_FROM=hello@linker.it.com
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

## 8. Endpoints API (extraits)
Base URL: `/api`
- `/auth` (login, register, reset password)
- `/users` (profil, update, public profile)
- `/threads` (create, list, like, repost)
- `/replies` (create, list, like, delete)
- `/follows` (follow, requests, accept/reject)
- `/notifications` (list, read, delete)
- `/settings` (privacy, notifications, display)
- `/docs` (Swagger UI)

## 9. UML — Diagrammes

### 9.1 Diagramme de Cas d'Utilisation
```mermaid
flowchart TD
  Visitor((Visiteur))
  User((Utilisateur Connecté))

  Visitor --> UC1[Consulter les threads publics]
  Visitor --> UC2[Créer un compte]
  Visitor --> UC3[Se connecter]

  User --> UC4[Créer un thread]
  User --> UC5[Liker un thread]
  User --> UC6[Repondre à un thread]
  User --> UC7[Reposter un thread]
  User --> UC8[Suivre un utilisateur]
  User --> UC9[Accepter/Refuser demande de suivi]
  User --> UC10[Gérer profil et paramètres]
  User --> UC11[Recevoir notifications]
  User --> UC12[Consulter notifications]
  User --> UC13[Demander réinitialisation mot de passe]
  User --> UC14[Modifier mot de passe]
  User --> UC15[Gérer médias et uploads]
```

### 9.2 Séquence d'Inscription d'un Utilisateur
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant E as Email Service (Resend)

  U->>F: Remplit formulaire d'inscription
  F->>A: POST /auth/register
  A->>DB: Vérifier username/email existants
  DB-->>A: Disponible
  A->>A: Hash password (bcrypt)
  A->>DB: Créer User
  DB-->>A: User créé
  A->>DB: Créer Settings par défaut
  DB-->>A: Settings créés
  A->>E: sendWelcomeEmail()
  E-->>A: Email envoyé
  A-->>F: 201 + { success, user, token }
  F-->>U: Redirection vers dashboard
```

### 9.3 Séquence de Création d'un Thread
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant N as NotificationService
  participant S as Socket.io

  U->>F: Renseigne contenu (+ médias optionnels)
  F->>A: POST /threads (avec token JWT)
  A->>A: Valider données (express-validator)
  A->>DB: Upload médias (Cloudinary)
  DB-->>A: URLs médias
  A->>DB: Insert Thread
  DB-->>A: Thread créé
  A->>N: Détecter mentions (@username)
  N->>DB: Créer notifications pour mentions
  A->>S: Emit new_thread (temps réel)
  A-->>F: 201 + { success, thread }
  F-->>U: Affichage du thread dans le feed
```

### 9.4 Séquence de Like d'un Thread
```mermaid
sequenceDiagram
  participant U1 as Utilisateur (like)
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant N as NotificationService
  participant S as Socket.io
  participant E as Email Service (Resend)
  participant U2 as Auteur du thread

  U1->>F: Click bouton like
  F->>A: POST /threads/:id/like (avec token)
  A->>DB: Vérifier si like existe déjà
  alt Like n'existe pas
    A->>DB: Créer Like + incrémenter likesCount
    DB-->>A: Like créé
    A->>DB: Récupérer auteur du thread
    DB-->>A: Auteur trouvé
    alt Auteur != Utilisateur qui like
      A->>N: createNotification(type: thread_like)
      N->>DB: Créer Notification
      N->>S: emit new_notification
      S-->>U2: Notification temps réel
      N->>E: sendNotificationEmail (si préférence activée)
      E-->>N: Email envoyé
    end
  else Like existe déjà
    A->>DB: Supprimer Like + décrémenter likesCount
    DB-->>A: Like supprimé
  end
  A-->>F: 200 + { success, isLiked, likesCount }
  F-->>U1: Mise à jour UI (bouton like)
```

### 9.5 Séquence de Follow d'un Utilisateur
```mermaid
sequenceDiagram
  participant U1 as Utilisateur (follower)
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant N as NotificationService
  participant S as Socket.io
  participant E as Email Service (Resend)
  participant U2 as Utilisateur (following)

  U1->>F: Click bouton "Suivre"
  F->>A: POST /follows/:userId (avec token)
  A->>DB: Vérifier compte U2 (isPrivate)
  DB-->>A: Statut compte
  alt Compte public
    A->>DB: Créer Follow (status: accepted)
    DB-->>A: Follow créé
    A->>DB: Incrémenter followersCount (U2) et followingCount (U1)
    A->>N: createNotification(type: new_follower)
    N->>DB: Créer Notification
    N->>S: emit new_notification
    S-->>U2: Notification temps réel
    N->>E: sendNotificationEmail (si préférence activée)
  else Compte privé
    A->>DB: Créer Follow (status: pending)
    DB-->>A: Follow créé
    A->>N: createNotification(type: follow_request)
    N->>DB: Créer Notification
    N->>S: emit new_notification
    S-->>U2: Notification demande de suivi
  end
  A-->>F: 200 + { success, status, follow }
  F-->>U1: Mise à jour UI (bouton follow)
```

### 9.6 Séquence de Réponse à un Thread
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant N as NotificationService
  participant S as Socket.io
  participant E as Email Service (Resend)
  participant Auteur as Auteur du thread

  U->>F: Renseigne réponse (+ médias optionnels)
  F->>A: POST /replies (threadId, content, token)
  A->>A: Valider données
  A->>DB: Upload médias (Cloudinary si présents)
  DB-->>A: URLs médias
  A->>DB: Créer Reply
  DB-->>A: Reply créé
  A->>DB: Incrémenter repliesCount du Thread
  A->>DB: Récupérer auteur du thread
  DB-->>A: Auteur trouvé
  alt Auteur != Utilisateur qui répond
    A->>N: createNotification(type: thread_reply)
    N->>DB: Créer Notification
    N->>S: emit new_notification
    S-->>Auteur: Notification temps réel
    N->>E: sendNotificationEmail (si préférence activée)
  end
  A->>N: Détecter mentions (@username) dans réponse
  N->>DB: Créer notifications pour mentions
  A->>S: Emit new_reply (temps réel)
  A-->>F: 201 + { success, reply }
  F-->>U: Affichage de la réponse
```

### 9.7 Séquence de Récupération des Notifications
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant S as Socket.io

  U->>F: Ouvre page notifications
  F->>A: GET /notifications (avec token)
  A->>A: Extraire userId du token JWT
  A->>DB: Find notifications (recipient: userId)
  A->>DB: Populate sender, thread, reply
  DB-->>A: Notifications avec données complètes
  A->>DB: Count unread notifications
  DB-->>A: unreadCount
  A-->>F: 200 + { success, notifications, unreadCount }
  F-->>U: Affichage liste notifications

  Note over S: Connexion WebSocket active
  S->>F: emit new_notification (temps réel)
  F->>F: Mise à jour compteur + ajout notification
```

### 9.8 Séquence de Réinitialisation de Mot de Passe
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant A as API
  participant DB as MongoDB
  participant PS as PasswordResetService
  participant E as Email Service (Resend)

  U->>F: Saisit email (page forgot-password)
  F->>A: POST /auth/forgot-password
  A->>PS: forgotPassword(email)
  PS->>DB: Find User by email
  DB-->>PS: User trouvé
  PS->>PS: generateResetToken(userId)
  PS->>PS: Construire resetUrl (FRONTEND_URL + token)
  PS->>E: sendResetPasswordEmail(email, userName, resetUrl)
  E->>E: Valider email
  E->>E: Envoyer email via Resend API
  E-->>PS: Email envoyé
  PS-->>A: { message, token }
  A-->>F: 200 + { success, message }
  F-->>U: Message "Email envoyé"

  Note over U: Utilisateur ouvre email
  U->>F: Clique lien reset (resetUrl)
  F->>F: Extraire token de l'URL
  U->>F: Saisit nouveau mot de passe
  F->>A: POST /auth/reset-password (token, newPassword)
  A->>PS: resetPassword(token, newPassword)
  PS->>PS: verifyResetToken(token)
  PS->>PS: Hash nouveau mot de passe
  PS->>DB: Update User password
  DB-->>PS: Password mis à jour
  PS-->>A: { success, message }
  A-->>F: 200 + { success, message }
  F-->>U: Redirection vers login
```

### 9.9 Diagramme de Classes (Complet)
```mermaid
classDiagram
  class User {
    +ObjectId _id
    +String username
    +String email
    +String password
    +String name
    +String bio
    +String profilePicture
    +String coverImage
    +String location
    +String website
    +Boolean isPrivate
    +Boolean isVerified
    +String language
    +Number followersCount
    +Number followingCount
    +Number threadsCount
    +Date createdAt
    +Date updatedAt
    --
    +comparePassword(candidatePassword) Boolean
    +getPublicProfile() Object
    +getMinimalProfile() Object
    +searchUsers(query, limit) Array~User~
    +isUsernameAvailable(username) Boolean
    +isEmailAvailable(email) Boolean
  }

  class Thread {
    +ObjectId _id
    +String content
    +Array media
    +ObjectId author
    +Number likesCount
    +Number repliesCount
    +Number repostsCount
    +Date createdAt
    +Date updatedAt
    --
    +incrementLikes() void
    +decrementLikes() void
    +incrementReplies() void
  }

  class Reply {
    +ObjectId _id
    +ObjectId thread
    +ObjectId parentReply
    +ObjectId author
    +String content
    +Array media
    +Number likesCount
    +Date createdAt
    --
    +incrementLikes() void
  }

  class Follow {
    +ObjectId _id
    +ObjectId follower
    +ObjectId following
    +String status
    +Date createdAt
  }

  class Notification {
    +ObjectId _id
    +String type
    +ObjectId recipient
    +ObjectId sender
    +ObjectId thread
    +ObjectId reply
    +Boolean isRead
    +Date createdAt
  }

  class Settings {
    +ObjectId _id
    +ObjectId user
    +Object notifications
    +Object privacy
    +Object display
    +Date updatedAt
  }

  class Like {
    +ObjectId _id
    +ObjectId user
    +ObjectId thread
    +ObjectId reply
    +Date createdAt
  }

  class Repost {
    +ObjectId _id
    +ObjectId user
    +ObjectId thread
    +Date createdAt
  }

  User "1" --> "*" Thread : author
  User "1" --> "*" Reply : author
  User "1" --> "*" Follow : follower
  User "1" --> "*" Follow : following
  User "1" --> "*" Notification : recipient
  User "1" --> "*" Notification : sender
  User "1" --> "*" Like : user
  User "1" --> "*" Repost : user
  User "1" --> "1" Settings : user
  Thread "1" --> "*" Reply : replies
  Thread "1" --> "*" Like : thread
  Thread "1" --> "*" Repost : thread
  Reply "1" --> "*" Like : reply
  Reply "1" --> "*" Reply : parentReply
```


## 10. Gantt (planification)

**Période :** 26/12/2025 → 06/02/2026. Diagramme détaillé avec tâches définies : voir **[GANTT.md](GANTT.md)**.

```mermaid
gantt
  title Planning projet Linker (26/12/2025 - 06/02/2026)
  dateFormat  YYYY-MM-DD
  section Analyse et conception
  Cadrage, besoins, UML, BDD, spec API   :a1, 2025-12-26, 8d
  section Backend
  Fondations + modèles + Auth             :b1, 2026-01-02, 6d
  API métier (users, threads, replies, follows) :b2, 2026-01-07, 8d
  Emails + Swagger                        :b3, 2026-01-12, 4d
  section Frontend
  Config + Auth + Layout                  :f1, 2026-01-05, 6d
  Feed, posts, réponses, profils, paramètres :f2, 2026-01-10, 10d
  section Temps réel
  Socket.io + notifications (backend + frontend + emails) :s1, 2026-01-12, 8d
  section Tests et déploiement
  Tests unitaires backend                 :t1, 2026-01-20, 8d
  Docker + doc + release                  :d1, 2026-01-27, 11d
```

## 11. DevOps / Deploiement
- Dockerfiles disponibles pour frontend et backend
- CORS + Helmet + rate limiting actifs
- Deploiement possible sur Render (backend) + Vercel (frontend)

## 12. Tests
- Backend: Jest (unit tests)


---
**Auteur:** Projet full-stack 2025 — Linker