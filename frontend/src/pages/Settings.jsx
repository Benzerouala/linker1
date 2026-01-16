"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Settings.css"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("privacy")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Suppression compte
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Paramètres
  const [settings, setSettings] = useState({
    privacy: {
      whoCanFollowMe: "everyone",
      whoCanSeeMyPosts: "everyone",
      whoCanMentionMe: "everyone",
      showOnlineStatus: true,
      showActivityStatus: true,
      allowDirectMessages: "everyone"
    },
    notifications: {
      email: {
        newFollower: true,
        followRequest: true,
        followAccepted: true,
        threadLike: true,
        threadReply: true,
        mention: true
      },
      push: {
        newFollower: true,
        followRequest: true,
        followAccepted: true,
        threadLike: true,
        threadReply: true,
        mention: true
      },
      inApp: {
        newFollower: true,
        followRequest: true,
        followAccepted: true,
        threadLike: true,
        threadReply: true,
        mention: true,
        contentValidated: true,
        contentFlagged: true
      }
    }
  })

  // Informations personnelles
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    bio: "",
    hobbies: [],
    location: "",
    website: "",
    birthDate: "",
    isPrivate: false
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [hobbyInput, setHobbyInput] = useState("")

  useEffect(() => {
    fetchSettings()
    fetchProfileInfo()
  }, [])

  const fetchProfileInfo = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setProfileInfo({
          name: data.user.name || "",
          bio: data.user.bio || "",
          hobbies: data.user.hobbies || [],
          location: data.user.location || "",
          website: data.user.website || "",
          birthDate: data.user.birthDate ? data.user.birthDate.split('T')[0] : "",
          isPrivate: data.user.isPrivate || false
        })
      }
    } catch (err) {
      console.error("Error fetching profile info:", err)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSettings(data.data)
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const updatePrivacySettings = async (privacyData) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings/privacy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(privacyData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Paramètres de confidentialité mis à jour")
        setSettings(prev => ({
          ...prev,
          privacy: { ...prev.privacy, ...privacyData }
        }))
      } else {
        setError(data.message || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationSettings = async (notificationData) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Préférences de notifications mises à jour")
        setSettings(prev => ({
          ...prev,
          notifications: { ...prev.notifications, ...notificationData }
        }))
      } else {
        setError(data.message || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const updateDisplaySettings = async (displayData) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings/display`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(displayData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Préférences d'affichage mises à jour")
        setSettings(prev => ({
          ...prev,
          display: { ...prev.display, ...displayData }
        }))
      } else {
        setError(data.message || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const updateContentSettings = async (contentData) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(contentData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Préférences de contenu mises à jour")
        setSettings(prev => ({
          ...prev,
          content: { ...prev.content, ...contentData }
        }))
      } else {
        setError(data.message || "Erreur lors de la mise à jour")
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const updateProfileInfo = async () => {
    try {
      setProfileLoading(true)
      setProfileError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileInfo)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Informations du profil mises à jour avec succès")
      } else {
        setProfileError(data.message || "Erreur lors de la mise à jour du profil")
      }
    } catch (err) {
      setProfileError("Erreur lors de la mise à jour du profil")
    } finally {
      setProfileLoading(false)
    }
  }

  const addHobby = () => {
    if (hobbyInput.trim() && !profileInfo.hobbies.includes(hobbyInput.trim())) {
      setProfileInfo(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobbyInput.trim()]
      }))
      setHobbyInput("")
    }
  }

  const removeHobby = (hobbyToRemove) => {
    setProfileInfo(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(hobby => hobby !== hobbyToRemove)
    }))
  }

  const updatePassword = async () => {
    try {
      setPasswordLoading(true)
      setPasswordError("")
      setSuccess("")

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError("Tous les champs sont requis")
        return
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères")
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("Les mots de passe ne correspondent pas")
        return
      }

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Mot de passe modifié avec succès")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setPasswordError(data.message || "Erreur lors de la modification du mot de passe")
      }
    } catch (err) {
      setPasswordError("Erreur lors de la modification du mot de passe")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      setError("Veuillez taper 'SUPPRIMER' en majuscules pour confirmer")
      return
    }

    try {
      setDeleteLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok && data.success) {
        localStorage.removeItem("token")
        localStorage.removeItem("userId")
        navigate("/")
        alert("Votre compte a été supprimé avec succès")
      } else {
        setError(data.message || "Erreur lors de la suppression du compte")
      }
    } catch (err) {
      console.error("Error deleting account:", err)
      setError("Erreur lors de la suppression du compte")
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetSettings = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser tous vos paramètres ?")) {
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/settings/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess("Paramètres réinitialisés")
        fetchSettings()
      } else {
        setError(data.message || "Erreur lors de la réinitialisation")
      }
    } catch (err) {
      setError("Erreur lors de la réinitialisation")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">Chargement des paramètres...</div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Paramètres</h1>
        <p>Gérez les paramètres de votre compte</p>
      </div>

      {error && <div className="settings-error">{error}</div>}
      {success && <div className="settings-success">{success}</div>}

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Informations personnelles
        </button>
        <button 
          className={`tab-button ${activeTab === "privacy" ? "active" : ""}`}
          onClick={() => setActiveTab("privacy")}
        >
          Confidentialité
        </button>
        <button 
          className={`tab-button ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
        <button 
          className={`tab-button ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Mot de passe
        </button>
        <button 
          className={`tab-button ${activeTab === "danger" ? "active" : ""}`}
          onClick={() => setActiveTab("danger")}
        >
          Danger
        </button>
      </div>

      <div className="settings-content">
        {activeTab === "profile" && (
          <div className="settings-section">
            <h2>Informations personnelles</h2>
            
            <div className="setting-group">
              <label>Nom complet</label>
              <input 
                type="text"
                value={profileInfo.name}
                onChange={(e) => setProfileInfo(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Votre nom complet"
                className="profile-input"
              />
            </div>

            <div className="setting-group">
              <label>Biographie</label>
              <textarea 
                value={profileInfo.bio}
                onChange={(e) => setProfileInfo(prev => ({
                  ...prev,
                  bio: e.target.value
                }))}
                placeholder="Parlez-nous de vous..."
                className="profile-textarea"
                rows="4"
              />
            </div>

            <div className="setting-group">
              <label>Localisation</label>
              <input 
                type="text"
                value={profileInfo.location}
                onChange={(e) => setProfileInfo(prev => ({
                  ...prev,
                  location: e.target.value
                }))}
                placeholder="Votre ville, pays..."
                className="profile-input"
              />
            </div>

            <div className="setting-group">
              <label>Site web</label>
              <input 
                type="url"
                value={profileInfo.website}
                onChange={(e) => setProfileInfo(prev => ({
                  ...prev,
                  website: e.target.value
                }))}
                placeholder="https://votresite.com"
                className="profile-input"
              />
            </div>

            <div className="setting-group">
              <label>Date de naissance</label>
              <input 
                type="date"
                value={profileInfo.birthDate}
                onChange={(e) => setProfileInfo(prev => ({
                  ...prev,
                  birthDate: e.target.value
                }))}
                className="profile-input"
              />
            </div>

            <div className="setting-group">
              <label>Centres d'intérêt (Hobbies)</label>
              <div className="hobby-input-container">
                <input 
                  type="text"
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  placeholder="Ajouter un hobby..."
                  className="hobby-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addHobby()
                    }
                  }}
                />
                <button type="button" onClick={addHobby} className="add-hobby-btn">
                  Ajouter
                </button>
              </div>
              <div className="hobbies-list">
                {profileInfo.hobbies.map((hobby, index) => (
                  <div key={index} className="hobby-tag">
                    {hobby}
                    <button 
                      type="button" 
                      onClick={() => removeHobby(hobby)}
                      className="remove-hobby-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={profileInfo.isPrivate}
                  onChange={(e) => setProfileInfo(prev => ({
                    ...prev,
                    isPrivate: e.target.checked
                  }))}
                />
                <span>Compte privé</span>
              </label>
              <p className="setting-description">
                Lorsque votre compte est privé, seules les personnes que vous acceptez peuvent voir vos publications.
              </p>
            </div>

            {profileError && <div className="profile-error">{profileError}</div>}

            <button 
              className="save-button"
              onClick={updateProfileInfo}
              disabled={profileLoading}
            >
              {profileLoading ? "Mise à jour..." : "Mettre à jour le profil"}
            </button>
          </div>
        )}

        {/* Confidentialité */}
        {activeTab === "privacy" && (
          <div className="settings-section">
            <h2>Paramètres de confidentialité</h2>
            
            <div className="setting-group">
              <label>Qui peut me suivre ?</label>
              <select 
                value={settings.privacy.whoCanFollowMe}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, whoCanFollowMe: e.target.value }
                }))}
              >
                <option value="everyone">Tout le monde</option>
                <option value="friends_of_friends">Amis d'amis</option>
                <option value="nobody">Personne</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Qui peut voir mes posts ?</label>
              <select 
                value={settings.privacy.whoCanSeeMyPosts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, whoCanSeeMyPosts: e.target.value }
                }))}
              >
                <option value="everyone">Tout le monde</option>
                <option value="followers">Abonnés uniquement</option>
                <option value="only_me">Moi uniquement</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Qui peut me mentionner ?</label>
              <select 
                value={settings.privacy.whoCanMentionMe}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, whoCanMentionMe: e.target.value }
                }))}
              >
                <option value="everyone">Tout le monde</option>
                <option value="followers">Abonnés uniquement</option>
                <option value="nobody">Personne</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Qui peut m'envoyer des messages ?</label>
              <select 
                value={settings.privacy.allowDirectMessages}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, allowDirectMessages: e.target.value }
                }))}
              >
                <option value="everyone">Tout le monde</option>
                <option value="followers">Abonnés uniquement</option>
                <option value="people_i_follow">Personnes que je suis</option>
                <option value="nobody">Personne</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={settings.privacy.showOnlineStatus}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showOnlineStatus: e.target.checked }
                  }))}
                />
                Afficher mon statut en ligne
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={settings.privacy.showActivityStatus}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showActivityStatus: e.target.checked }
                  }))}
                />
                Afficher mon statut d'activité
              </label>
            </div>

            <button 
              className="save-button"
              onClick={() => updatePrivacySettings(settings.privacy)}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer la confidentialité"}
            </button>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="settings-section">
            <h2>Préférences de notifications</h2>
            
            <div className="notification-group">
              <h3>Notifications par email</h3>
              {Object.entries(settings.notifications.email).map(([key, value]) => (
                <label key={key} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: {
                          ...prev.notifications.email,
                          [key]: e.target.checked
                        }
                      }
                    }))}
                  />
                  {getNotificationLabel(key)}
                </label>
              ))}
            </div>

            <div className="notification-group">
              <h3>Notifications push</h3>
              {Object.entries(settings.notifications.push).map(([key, value]) => (
                <label key={key} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        push: {
                          ...prev.notifications.push,
                          [key]: e.target.checked
                        }
                      }
                    }))}
                  />
                  {getNotificationLabel(key)}
                </label>
              ))}
            </div>

            <div className="notification-group">
              <h3>Notifications in-app</h3>
              {Object.entries(settings.notifications.inApp).map(([key, value]) => (
                <label key={key} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        inApp: {
                          ...prev.notifications.inApp,
                          [key]: e.target.checked
                        }
                      }
                    }))}
                  />
                  {getNotificationLabel(key)}
                </label>
              ))}
            </div>

            <button 
              className="save-button"
              onClick={() => updateNotificationSettings(settings.notifications)}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer les notifications"}
            </button>
          </div>
        )}

        {/* Mot de passe */}
        {activeTab === "password" && (
          <div className="settings-section">
            <h2>Modifier le mot de passe</h2>
            
            <div className="setting-group">
              <label>Mot de passe actuel</label>
              <input 
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                placeholder="Entrez votre mot de passe actuel"
                className="password-input"
              />
            </div>

            <div className="setting-group">
              <label>Nouveau mot de passe</label>
              <input 
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                placeholder="Entrez votre nouveau mot de passe (min. 8 caractères)"
                className="password-input"
              />
            </div>

            <div className="setting-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input 
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                placeholder="Confirmez votre nouveau mot de passe"
                className="password-input"
              />
            </div>

            {passwordError && <div className="password-error">{passwordError}</div>}

            <button 
              className="save-button"
              onClick={updatePassword}
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              {passwordLoading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </div>
        )}

        {/* Zone de danger */}
        {activeTab === "danger" && (
          <div className="settings-section danger-section">
            <div className="section-header">
              <h2>⚠️ Zone de danger</h2>
              <p>Actions irréversibles pour votre compte</p>
            </div>

            <div className="danger-item">
              <div className="danger-info">
                <h3>Réinitialiser les paramètres</h3>
                <p>
                  Réinitialiser tous vos paramètres aux valeurs par défaut.
                </p>
              </div>
              <button 
                className="warning-btn"
                onClick={resetSettings}
                disabled={saving}
              >
                {saving ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </div>

            <div className="danger-item">
              <div className="danger-info">
                <h3>Supprimer mon compte</h3>
                <p>
                  Cette action est <strong>irréversible</strong>. Supprimer votre compte entraînera :
                </p>
                <ul>
                  <li>La suppression permanente de toutes vos données</li>
                  <li>La suppression de tous vos posts et commentaires</li>
                  <li>La suppression de vos informations personnelles</li>
                  <li>La perte de tous vos abonnements et abonnés</li>
                </ul>
              </div>
              <button 
                className="danger-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>⚠️ Confirmation de suppression</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation("")
                  setError("")
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="warning-text">
                Vous êtes sur le point de supprimer définitivement votre compte.
              </p>
              <p className="warning-text">
                <strong>Cette action ne peut pas être annulée.</strong>
              </p>

              <div className="confirmation-step">
                <p>
                  Pour confirmer, tapez <code>SUPPRIMER</code> dans le champ ci-dessous :
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="confirmation-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation("")
                  setError("")
                }}
                disabled={deleteLoading}
              >
                Annuler
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmation !== "SUPPRIMER"}
              >
                {deleteLoading ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getNotificationLabel(key) {
  const labels = {
    newFollower: "Nouvel abonné",
    followRequest: "Demande de suivi",
    followAccepted: "Suivi accepté",
    threadLike: "J'aime sur un post",
    threadReply: "Réponse à un post",
    mention: "Mention",
    contentValidated: "Contenu validé",
    contentFlagged: "Contenu signalé"
  }
  return labels[key] || key
}
