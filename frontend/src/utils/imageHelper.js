//frontend/src/utils/imageHelper.js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

export const getImageUrl = (path, type = "avatar", username = "User") => {
  if (!path) {
    if (type === "avatar") {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username,
      )}&size=200&background=9333ea&color=fff&bold=true`
    }
    return "/placeholder.svg" // Placeholder for cover images
  }

  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path
  }

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${BACKEND_URL}${cleanPath}`
}
