import { Link } from "react-router-dom";
import "../styles/HomeNavbar.css";

export default function HomeNavbar() {
  return (
    <nav className="home-navbar">
      <div className="home-navbar-container">
        <Link to="/" className="home-navbar-logo">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="home-navbar-logo-image"
          />
        </Link>

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
