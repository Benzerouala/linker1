
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
const BRAND_AVATAR_BG = "4FD04C"

export const getImageUrl = (path, type = "avatar", username = "User") => {
  if (!path) {
    if (type === "avatar") {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username,
      )}&size=200&background=${BRAND_AVATAR_BG}&color=fff&bold=true`
    }
    return "/placeholder.svg" // Placeholder for cover images
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
  return `${BACKEND_URL}${cleanPath}`
}
