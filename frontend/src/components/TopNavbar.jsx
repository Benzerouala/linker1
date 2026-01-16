import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/TopNavbar.css";

export default function TopNavbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="top-navbar">
      <div className="top-navbar-header">
        <Link to="/dashboard" className="top-navbar-logo">
          <img
            src="/images/logo.png"
            alt="Réseau Social"
            className="top-navbar-logo-image"
          />
        </Link>
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
