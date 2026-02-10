
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
const BRAND_AVATAR_BG = "4FD04C"

export const getImageUrl = (path, type = "avatar", username = "User") => {
  // En production, utiliser les avatars générés si le backend ne fonctionne pas
  if (import.meta.env.PROD && type === "avatar") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username,
    )}&size=200&background=${BRAND_AVATAR_BG}&color=fff&bold=true`
  }

  if (!path) {
    if (type === "avatar") {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username,
      )}&size=200&background=${BRAND_AVATAR_BG}&color=fff&bold=true`
    }
    // Retourner un SVG placeholder inline pour éviter les erreurs réseau
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgSW1hZ2Ugbm9uIGRpc3BvbmlibGUKICA8L3RleHQ+Cjwvc3ZnPg=="
  }

  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
    // Remplacer les anciennes couleurs d'avatar par le thème vert
    if (type === "avatar" && path.includes("ui-avatars.com") && path.includes("background=")) {
      return path.replace(/background=[a-fA-F0-9]+/, `background=${BRAND_AVATAR_BG}`)
    }
    return path
  }

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const fullUrl = `${BACKEND_URL}${cleanPath}`
  
  // Ajouter un timestamp pour éviter le cache si c'est une image d'utilisateur
  if (type === "avatar" || type === "cover" || type === "media") {
    return `${fullUrl}?t=${Date.now()}`
  }
  
  return fullUrl
}

export const handleImageError = (e) => {
  // Utiliser un placeholder SVG pour toutes les erreurs d'images
  e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgSW1hZ2Ugbm9uIGRpc3BvbmlibGUKICA8L3RleHQ+Cjwvc3ZnPg=="
}
