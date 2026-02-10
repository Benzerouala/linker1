import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getImageUrl } from "../utils/imageHelper";
import "../styles/TopNavbar.css";
import API_URL from "../utils/api";

export default function TopNavbar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef(null);

  const currentQuery = new URLSearchParams(location.search).get("q") || "";

  useEffect(() => {
    if (location.pathname.startsWith("/search")) {
      if (searchQuery !== currentQuery) {
        setSearchQuery(currentQuery);
      }
    }
  }, [location.pathname, currentQuery]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setIsLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const response = await fetch(
          `${API_URL}/users/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          { headers },
        );
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data || []);
        } else {
          setSuggestions([]);
        }
        setIsSuggestionsOpen(true);
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        setSuggestions([]);
        setIsSuggestionsOpen(true);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isSuggestionsOpen) return;

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSuggestionsOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectUser = (user) => {
    const currentUserId = localStorage.getItem("userId");
    const userId = user?._id || user?.id;
    setIsSuggestionsOpen(false);
    setSearchQuery("");
    setSuggestions([]);

    if (currentUserId && userId?.toString() === currentUserId.toString()) {
      navigate("/dashboard/profile");
      return;
    }

    navigate(`/profile/${user.username}`);
  };

  return (
    <div className="top-navbar">
      <div className="top-navbar-header">
        <Link to="/dashboard/posts" className="top-navbar-logo">
          <img
            src="/images/logo.png"
            alt="Linker"
            className="top-navbar-logo-image"
            onError={(e) => {
              // Fallback si le logo n'existe pas
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <span className="top-navbar-logo-text" style={{ display: "none" }}>
            Linker
          </span>
        </Link>

        <form onSubmit={handleSearch} className="top-navbar-search-form">
          <div className="top-navbar-search-wrapper" ref={searchRef}>
            <svg
              className="top-navbar-search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              className="top-navbar-search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsSuggestionsOpen(true);
                }
              }}
            />
            {isSuggestionsOpen && (
              <div className="top-navbar-search-suggestions">
                {isLoadingSuggestions ? (
                  <div className="search-suggestion-state">Recherche...</div>
                ) : suggestions.length === 0 ? (
                  <div className="search-suggestion-state">
                    Aucun utilisateur
                  </div>
                ) : (
                  suggestions.map((user) => (
                    <button
                      key={user._id || user.id}
                      type="button"
                      className="search-suggestion-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img
                        src={
                          getImageUrl(
                            user.profilePicture,
                            "avatar",
                            user.username,
                          ) || "/placeholder.svg"
                        }
                        alt={user.username}
                        className="search-suggestion-avatar"
                        onError={(e) => {
                          e.target.src = getImageUrl(
                            null,
                            "avatar",
                            user.username,
                          );
                        }}
                      />
                      <div className="search-suggestion-info">
                        <span className="search-suggestion-name">
                          {user.name || user.username}
                        </span>
                        <span className="search-suggestion-username">
                          @{user.username}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </form>

        <button
          className="top-navbar-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
