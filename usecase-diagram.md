# Diagramme de Cas d'Utilisation - Projet Réseau Social

```mermaid
graph TD
    %% Acteurs principaux
    User((Utilisateur<br/>non authentifié))
    AuthenticatedUser((Utilisateur<br/>authentifié))
    Admin((Administrateur))

    %% Système
    System(Système de<br/>Réseau Social)

    %% Cas d'utilisation principaux
    subgraph "Gestion du Compte"
        Register[S'inscrire]
        Login[Se connecter]
        Logout[Se déconnecter]
        ForgotPassword[Mot de passe oublié]
        ResetPassword[Réinitialiser mot de passe]
        ViewProfile[Voir profil public]
        EditProfile[Modifier profil]
        DeleteAccount[Supprimer compte]
    end

    subgraph "Gestion des Threads"
        CreateThread[Créer un thread]
        ViewThread[Voir un thread]
        EditThread[Modifier son thread]
        DeleteThread[Supprimer son thread]
        ViewUserThreads[Voir threads d'un utilisateur]
        SearchThreads[Rechercher des threads]
    end

    subgraph "Gestion des Réponses"
        CreateReply[Répondre à un thread]
        ViewReplies[Voir les réponses]
        DeleteReply[Supprimer sa réponse]
    end

    subgraph "Gestion des Likes"
        LikeThread[Liker un thread]
        UnlikeThread[Retirer son like]
        ViewLikes[Voir les likes]
    end

    subgraph "Gestion des Abonnements"
        FollowUser[S'abonner à un utilisateur]
        UnfollowUser[Se désabonner]
        AcceptFollow[Accepter demande d'abonnement]
        RejectFollow[Rejeter demande d'abonnement]
        ViewFollowers[Voir abonnés]
        ViewFollowing[Voir abonnements]
    end

    subgraph "Gestion des Notifications"
        ViewNotifications[Voir notifications]
        MarkAsRead[Marquer comme lues]
        GetUnreadCount[Voir nombre non lues]
    end

    subgraph "Fonctionnalités Système"
        CheckUsername[Vérifier disponibilité username]
        CheckEmail[Vérifier disponibilité email]
        UploadMedia[Télécharger média]
        SearchUsers[Rechercher utilisateurs]
    end

    %% Relations entre acteurs et cas d'utilisation
    User --> Register
    User --> Login
    User --> ForgotPassword
    User --> ViewProfile
    User --> ViewThread
    User --> ViewUserThreads
    User --> SearchThreads
    User --> ViewReplies
    User --> ViewLikes
    User --> ViewFollowers
    User --> ViewFollowing
    User --> CheckUsername
    User --> CheckEmail
    User --> SearchUsers

    AuthenticatedUser --> Logout
    AuthenticatedUser --> ResetPassword
    AuthenticatedUser --> EditProfile
    AuthenticatedUser --> DeleteAccount
    AuthenticatedUser --> CreateThread
    AuthenticatedUser --> EditThread
    AuthenticatedUser --> DeleteThread
    AuthenticatedUser --> CreateReply
    AuthenticatedUser --> DeleteReply
    AuthenticatedUser --> LikeThread
    AuthenticatedUser --> UnlikeThread
    AuthenticatedUser --> FollowUser
    AuthenticatedUser --> UnfollowUser
    AuthenticatedUser --> AcceptFollow
    AuthenticatedUser --> RejectFollow
    AuthenticatedUser --> ViewNotifications
    AuthenticatedUser --> MarkAsRead
    AuthenticatedUser --> GetUnreadCount
    AuthenticatedUser --> UploadMedia

    Admin --> AdminPanel[Panneau d'administration]
    Admin --> ManageUsers[Gérer les utilisateurs]
    Admin --> ViewSystemStats[Voir statistiques système]

    %% Relations d'héritage
    AuthenticatedUser -.-> User

    %% Inclusions et extensions
    CreateThread ..> UploadMedia : <<include>>
    EditThread ..> UploadMedia : <<include>>
    CreateReply ..> ViewThread : <<include>>
    LikeThread ..> ViewThread : <<include>>
    UnlikeThread ..> ViewThread : <<include>>
    FollowUser ..> ViewProfile : <<include>>
    AcceptFollow ..> ViewNotifications : <<include>>
    RejectFollow ..> ViewNotifications : <<include>>

    %% Notes
    noteForUser[Note: L'utilisateur non authentifié<br/>peut voir les contenus publics]
    noteForAuth[Note: L'utilisateur authentifié<br/>a accès à toutes les fonctionnalités]
    noteForAdmin[Note: L'administrateur a des<br/>droits supplémentaires]

    User --- noteForUser
    AuthenticatedUser --- noteForAuth
    Admin --- noteForAdmin
```

## Description des Acteurs

### 1. Utilisateur Non Authentifié
- Peut consulter les profils publics
- Peut voir les threads publics
- Peut rechercher des threads et utilisateurs
- Peut s'inscrire et se connecter

### 2. Utilisateur Authentifié
- Toutes les fonctionnalités de base
- Peut créer, modifier, supprimer ses contenus
- Peut interagir (likes, réponses, abonnements)
- Peut gérer son profil et ses notifications

### 3. Administrateur
- Toutes les fonctionnalités utilisateur
- Accès au panneau d'administration
- Peut gérer les utilisateurs
- Peut voir les statistiques système

## Description des Cas d'Utilisation Principaux

### Gestion du Compte
- **S'inscrire**: Création d'un nouveau compte avec email, username, mot de passe
- **Se connecter**: Authentification avec email et mot de passe
- **Modifier profil**: Mise à jour des informations personnelles
- **Supprimer compte**: Suppression définitive du compte et des données associées

### Gestion des Contenus
- **Créer thread**: Publication avec texte et/ou média
- **Répondre**: Ajouter une réponse à un thread existant
- **Liker**: Exprimer son appréciation d'un thread
- **Modifier/Supprimer**: Gérer ses propres publications

### Gestion des Relations
- **S'abonner**: Suivre un utilisateur (avec validation si profil privé)
- **Se désabonner**: Arrêter de suivre un utilisateur
- **Accepter/Rejeter**: Gérer les demandes d'abonnement

### Gestion des Notifications
- **Voir notifications**: Consulter toutes ses notifications
- **Marquer comme lues**: Gérer l'état de lecture des notifications
