classDiagram
    %% Classe User (Entité principale)
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
        --
        +searchUsers(query, limit) Array~User~
        +isUsernameAvailable(username) Boolean
        +isEmailAvailable(email) Boolean
    }

    %% Classe Thread
    class Thread {
        +ObjectId _id
        +ObjectId author
        +String content
        +Object media
        +Array~ObjectId~ likes
        +Array~ObjectId~ replies
        +ObjectId replyTo
        +Date createdAt
        +Date updatedAt
        --
        +Number likesCount (virtual)
        +Number repliesCount (virtual)
    }

    %% Classe Reply
    class Reply {
        +ObjectId _id
        +ObjectId author
        +ObjectId thread
        +String content
        +Date createdAt
        +Date updatedAt
    }

    %% Classe Like
    class Like {
        +ObjectId _id
        +ObjectId user
        +ObjectId thread
        +Date createdAt
        +Date updatedAt
    }

    %% Classe Follow
    class Follow {
        +ObjectId _id
        +ObjectId follower
        +ObjectId following
        +String status
        +Date createdAt
        +Date updatedAt
    }

    %% Classe Settings
    class Settings {
        +ObjectId _id
        +ObjectId user
        +Object notifications
        +Object privacy
        +Object display
        +Object content
        +Date createdAt
        +Date updatedAt
        --
        +canReceiveNotification(userId, type, channel) Boolean
        +canViewContent(viewerId, targetUserId) Boolean
        +canMentionUser(mentionerId, targetUserId) Boolean
    }

    %% Classe Notification
    class Notification {
        +ObjectId _id
        +String type
        +ObjectId recipient
        +ObjectId sender
        +ObjectId thread
        +Boolean isRead
        +Date createdAt
        +Date updatedAt
    }

    %% Relations entre les classes
    User "1" -- "0..*" Thread : author >
    User "1" -- "0..*" Reply : author >
    User "1" -- "0..*" Like : user >
    User "1" -- "0..*" Follow : follower >
    User "1" -- "0..*" Follow : following >
    User "1" -- "0..*" Notification : recipient >
    User "1" -- "0..*" Notification : sender >
    User "1" -- "1" Settings : user >

    Thread "1" -- "0..*" Reply : thread >
    Thread "1" -- "0..*" Like : thread >
    Thread "1" -- "0..*" Thread : replyTo >
    Thread "1" -- "0..*" Notification : thread >
    Thread "0..*" -- "0..*" Thread : replies >

    %% Contraintes et notes
    note for Follow "status enum: ['requested', 'accepted', 'blocked']"
    note for Notification "type enum: ['new_follower', 'follow_request', 'follow_accepted', 'thread_like', 'thread_reply', 'mention']"
    note for Thread "media: {url: String, type: String}"
    note for User "resetPasswordToken et resetPasswordExpires ne sont pas utilisés"
    note for Settings "notifications: {email, push, inApp}, privacy: {whoCanFollowMe, whoCanSeeMyPosts, whoCanMentionMe}, display: {theme, language, fontSize}, content: {autoplayVideos, showMediaPreviews}"