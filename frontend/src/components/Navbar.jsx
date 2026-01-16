import { Link } from "react-router-dom"
import "../styles/Navbar.css"

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="navbar-logo-image"
          />
        </Link>
        
        <div className="navbar-buttons">
          <button className="navbar-btn navbar-btn-primary">
            Connexion
          </button>
          <button className="navbar-btn navbar-btn-secondary">
            Inscription
          </button>
        </div>
      </div>
    </nav>
  )
}