import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/HomeNavbar.css";

export default function HomeNavbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="home-navbar">
      <div className="home-navbar-container">
        <div className="home-navbar-left">
          <Link to="/" className="home-navbar-logo">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="home-navbar-logo-image"
            />
          </Link>
          <button
            className="home-navbar-theme-toggle"
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

        <div className="home-navbar-buttons">
          <Link to="/login" className="home-navbar-btn home-navbar-btn-primary">
            Connexion
          </Link>
          <Link
            to="/register"
            className="home-navbar-btn home-navbar-btn-secondary"
          >
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  );
}
