# API Endpoints — Linker

Base URL: `http://localhost:5000/api`

## Table des matières
- [Authentification](#authentification)
- [Utilisateurs](#utilisateurs)
- [Threads](#threads)
- [Réponses (Replies)](#réponses-replies)
- [Follows](#follows)
- [Notifications](#notifications)
- [Paramètres (Settings)](#paramètres-settings)
- [Health Check](#health-check)

---

## Authentification

### POST `/api/auth/register`
Inscription d'un nouvel utilisateur

**Body:**
```json
{
  "name": "string",
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Réponse:** `201` - Utilisateur créé avec token JWT

---

### POST `/api/auth/login`
Connexion d'un utilisateur

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Réponse:** `200` - Token JWT + données utilisateur

---

### POST `/api/auth/check-username`
Vérifier la disponibilité d'un nom d'utilisateur

**Body:**
```json
{
  "username": "string"
}
```

**Réponse:** `200` - `{ success: true, available: boolean }`

---

### POST `/api/auth/check-email`
Vérifier la disponibilité d'un email

**Body:**
```json
{
  "email": "string"
}
```

**Réponse:** `200` - `{ success: true, available: boolean }`

---

### POST `/api/auth/forgot-password`
Demander une réinitialisation de mot de passe

**Body:**
```json
{
  "email": "string"
}
```

**Réponse:** `200` - Email de réinitialisation envoyé (via Resend)

---

### POST `/api/auth/reset-password`
Réinitialiser le mot de passe avec un token

**Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Réponse:** `200` - Mot de passe réinitialisé

---

### GET `/api/auth/me`
Obtenir les informations de l'utilisateur connecté

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Données utilisateur

---

### POST `/api/auth/logout`
Déconnexion

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Déconnexion réussie

---

## Utilisateurs

### GET `/api/users/me`
Obtenir le profil de l'utilisateur connecté

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Profil utilisateur

---

### PUT `/api/users/me`
Mettre à jour le profil

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "string",
  "bio": "string",
  "location": "string",
  "website": "string"
}
```

**Réponse:** `200` - Profil mis à jour

---

### PUT `/api/users/me/profile-picture`
Mettre à jour la photo de profil

**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data` avec champ `profilePicture` (fichier image)

**Réponse:** `200` - Photo de profil mise à jour

---

### PUT `/api/users/me/cover-image`
Mettre à jour l'image de couverture

**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data` avec champ `coverImage` (fichier image)

**Réponse:** `200` - Image de couverture mise à jour

---

### PUT `/api/users/me/password`
Changer le mot de passe

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Réponse:** `200` - Mot de passe changé

---

### DELETE `/api/users/me`
Supprimer le compte

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Compte supprimé

---

### GET `/api/users/search?q=<query>`
Rechercher des utilisateurs

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Query Parameters:**
- `q` (required): Terme de recherche

**Réponse:** `200` - Liste d'utilisateurs

---

### GET `/api/users/username/:username`
Obtenir un utilisateur par son nom d'utilisateur

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `username`: Nom d'utilisateur

**Réponse:** `200` - Profil utilisateur

---

### GET `/api/users/:id`
Obtenir un utilisateur par son ID

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `id`: ID de l'utilisateur

**Réponse:** `200` - Profil utilisateur

---

### GET `/api/users/:id/stats`
Obtenir les statistiques d'un utilisateur

**Path Parameters:**
- `id`: ID de l'utilisateur

**Réponse:** `200` - Statistiques (followers, following, threads)

---

### GET `/api/users/suggestions/users`
Obtenir des suggestions d'utilisateurs à suivre

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Liste d'utilisateurs suggérés

---

## Threads

### GET `/api/threads`
Lister tous les threads (publics)

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Liste de threads

---

### GET `/api/threads/feed`
Obtenir le fil d'actualité (threads des utilisateurs suivis)

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Fil d'actualité

---

### GET `/api/threads/search?q=<query>`
Rechercher des threads

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Query Parameters:**
- `q` (required): Terme de recherche

**Réponse:** `200` - Résultats de recherche

---

### GET `/api/threads/user/:userId`
Obtenir les threads d'un utilisateur

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `userId`: ID de l'utilisateur

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Liste de threads

---

### GET `/api/threads/:id`
Obtenir un thread par son ID

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Détails du thread

---

### GET `/api/threads/:id/likes`
Obtenir les utilisateurs qui ont liké un thread

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Liste d'utilisateurs

---

### POST `/api/threads`
Créer un thread

**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data`
- `content` (required): Contenu du thread
- `media` (optionnel): Fichier média (image/vidéo)

**Réponse:** `201` - Thread créé

---

### PUT `/api/threads/:id`
Mettre à jour un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Body:** `multipart/form-data`
- `content` (required): Nouveau contenu
- `media` (optionnel): Nouveau fichier média

**Réponse:** `200` - Thread mis à jour

---

### DELETE `/api/threads/:id`
Supprimer un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Thread supprimé

---

### POST `/api/threads/:id/like`
Liker un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Thread liké + notification envoyée

---

### DELETE `/api/threads/:id/unlike`
Retirer le like d'un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Like retiré

---

### POST `/api/threads/:id/repost`
Reposter un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Thread reposté + notification envoyée

---

### DELETE `/api/threads/:id/repost`
Retirer un repost

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID du thread

**Réponse:** `200` - Repost retiré

---

## Réponses (Replies)

### GET `/api/replies/:threadId`
Obtenir toutes les réponses d'un thread

**Path Parameters:**
- `threadId`: ID du thread

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Liste de réponses

---

### POST `/api/replies/:threadId`
Créer une réponse à un thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `threadId`: ID du thread

**Body:**
```json
{
  "content": "string",
  "parentReplyId": "string" // optionnel, pour les réponses imbriquées
}
```

**Réponse:** `201` - Réponse créée + notification envoyée

---

### GET `/api/replies/:id/likes`
Obtenir les utilisateurs qui ont liké une réponse

**Path Parameters:**
- `id`: ID de la réponse

**Réponse:** `200` - Liste d'utilisateurs

---

### PUT `/api/replies/:id`
Mettre à jour une réponse

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la réponse

**Body:**
```json
{
  "content": "string"
}
```

**Réponse:** `200` - Réponse mise à jour

---

### DELETE `/api/replies/:id`
Supprimer une réponse

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la réponse

**Réponse:** `200` - Réponse supprimée

---

### POST `/api/replies/:id/like`
Liker une réponse

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la réponse

**Réponse:** `200` - Réponse likée + notification envoyée

---

### DELETE `/api/replies/:id/unlike`
Retirer le like d'une réponse

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la réponse

**Réponse:** `200` - Like retiré

---

### POST `/api/replies/:id/repost`
Reposter une réponse comme thread

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la réponse

**Réponse:** `200` - Réponse repostée

---

## Follows

### POST `/api/follows/:userId/follow`
Suivre un utilisateur

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `userId`: ID de l'utilisateur à suivre

**Réponse:** `200` - Suivi créé (accepted ou pending selon compte privé/public) + notification

---

### DELETE `/api/follows/:userId/unfollow`
Ne plus suivre un utilisateur

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `userId`: ID de l'utilisateur

**Réponse:** `200` - Suivi supprimé

---

### DELETE `/api/follows/:userId/remove-follower`
Retirer un abonné

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `userId`: ID de l'abonné à retirer

**Réponse:** `200` - Abonné retiré

---

### POST `/api/follows/:userId/accept`
Accepter une demande de suivi

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `userId`: ID de l'utilisateur qui a fait la demande

**Réponse:** `200` - Demande acceptée + notification

---

### POST `/api/follows/:userId/reject`
Refuser une demande de suivi

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `userId`: ID de l'utilisateur qui a fait la demande

**Réponse:** `200` - Demande refusée

---

### GET `/api/follows/pending`
Obtenir les demandes de suivi en attente

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Liste de demandes en attente

---

### GET `/api/follows/sent`
Obtenir les demandes de suivi envoyées

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Liste de demandes envoyées

---

### GET `/api/follows/:userId/followers`
Obtenir les abonnés d'un utilisateur

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `userId`: ID de l'utilisateur

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Liste d'abonnés

---

### GET `/api/follows/:userId/following`
Obtenir les abonnements d'un utilisateur

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Path Parameters:**
- `userId`: ID de l'utilisateur

**Query Parameters:**
- `limit` (optionnel): Nombre de résultats
- `skip` (optionnel): Nombre de résultats à sauter

**Réponse:** `200` - Liste d'abonnements

---

## Notifications

### GET `/api/notifications`
Obtenir toutes les notifications de l'utilisateur connecté

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optionnel, défaut: 20): Nombre de résultats

**Réponse:** `200` - `{ success: true, data: { notifications: [], unreadCount: number } }`

---

### GET `/api/notifications/unread-count`
Obtenir le nombre de notifications non lues

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - `{ success: true, unreadCount: number }`

---

### PUT `/api/notifications/:id/read`
Marquer une notification comme lue

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la notification

**Réponse:** `200` - Notification marquée comme lue

---

### PUT `/api/notifications/read-all`
Marquer toutes les notifications comme lues

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Toutes les notifications marquées comme lues

---

### DELETE `/api/notifications/:id`
Supprimer une notification

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID de la notification

**Réponse:** `200` - Notification supprimée

---

### DELETE `/api/notifications/clear-all`
Supprimer toutes les notifications

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Toutes les notifications supprimées

---

## Paramètres (Settings)

### GET `/api/settings`
Obtenir tous les paramètres de l'utilisateur

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Paramètres complets (notifications, privacy, display, content)

---

### PUT `/api/settings`
Mettre à jour tous les paramètres

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "notifications": { ... },
  "privacy": { ... },
  "display": { ... },
  "content": { ... }
}
```

**Réponse:** `200` - Paramètres mis à jour

---

### PUT `/api/settings/notifications`
Mettre à jour les préférences de notifications

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": {
    "newFollower": true,
    "followRequest": true,
    "followAccepted": true,
    "threadLike": true,
    "threadReply": true,
    "replyLike": true,
    "mention": true
  },
  "inApp": {
    "newFollower": true,
    "followRequest": true,
    "followAccepted": true,
    "threadLike": true,
    "threadReply": true,
    "replyLike": true,
    "mention": true
  }
}
```

**Réponse:** `200` - Préférences de notifications mises à jour

---

### PUT `/api/settings/privacy`
Mettre à jour les paramètres de confidentialité

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "whoCanFollowMe": "everyone" | "friends_of_friends" | "nobody",
  "whoCanSeeMyPosts": "everyone" | "followers" | "only_me",
  "whoCanMentionMe": "everyone" | "followers" | "nobody",
  "showOnlineStatus": true,
  "showActivityStatus": true,
  "allowDirectMessages": "everyone" | "followers" | "people_i_follow" | "nobody"
}
```

**Réponse:** `200` - Paramètres de confidentialité mis à jour

---

### PUT `/api/settings/display`
Mettre à jour les préférences d'affichage

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "theme": "light" | "dark" | "auto",
  "language": "fr" | "ar" | "en",
  "fontSize": "small" | "medium" | "large",
  "showSensitiveContent": true
}
```

**Réponse:** `200` - Préférences d'affichage mises à jour

---

### PUT `/api/settings/content`
Mettre à jour les préférences de contenu

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "autoplayVideos": true,
  "showMediaPreviews": true,
  "enableMentions": true
}
```

**Réponse:** `200` - Préférences de contenu mises à jour

---

### POST `/api/settings/reset`
Réinitialiser tous les paramètres aux valeurs par défaut

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200` - Paramètres réinitialisés

---

### GET `/api/settings/check-permission/:targetUserId`
Vérifier si l'utilisateur peut voir le contenu d'un autre utilisateur

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `targetUserId`: ID de l'utilisateur cible

**Réponse:** `200` - `{ success: true, canView: boolean }`

---

### GET `/api/settings/check-mention/:targetUserId`
Vérifier si l'utilisateur peut mentionner un autre utilisateur

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `targetUserId`: ID de l'utilisateur cible

**Réponse:** `200` - `{ success: true, canMention: boolean }`

---

## Health Check

### GET `/api/health`
Vérifier l'état de l'API

**Réponse:** `200` - `{ success: true, message: "API is running" }`

---

## Documentation Swagger

### GET `/api/docs`
Interface Swagger UI pour tester tous les endpoints

Accès: `http://localhost:5000/api/docs`

---

## Notes importantes

### Authentification
- Les routes protégées nécessitent un header `Authorization: Bearer <token>`
- Le token JWT est obtenu lors de la connexion ou de l'inscription
- Le token expire après une certaine durée (configurée dans le backend)

### Rate Limiting
- Les routes d'authentification (`/auth/register`, `/auth/login`) ont un rate limiting plus strict
- Les routes de vérification (`/auth/check-username`, `/auth/check-email`) ont un rate limiting modéré

### Formats de réponse
Toutes les réponses suivent le format:
```json
{
  "success": true,
  "data": { ... },
  "message": "string" // optionnel
}
```

En cas d'erreur:
```json
{
  "success": false,
  "message": "Message d'erreur",
  "error": { ... } // optionnel, en développement
}
```

### Codes de statut HTTP
- `200` - Succès
- `201` - Créé
- `400` - Erreur de validation
- `401` - Non autorisé
- `403` - Interdit
- `404` - Non trouvé
- `500` - Erreur serveur

---

**Dernière mise à jour:** Janvier 2025
