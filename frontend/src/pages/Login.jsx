//frontend/src/pages/Login.jsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Feed from "../components/Feed";
import HomeNavbar from "../components/HomeNavbar";
import "../styles/Login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      if (response.data.success) {
        const { token, user } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user._id);
        window.dispatchEvent(new CustomEvent("auth-change"));

        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          "Erreur lors de la connexion"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <HomeNavbar />
      <div className="auth-split-page">
        <div className="auth-split-right">
          <div className="login-container">
            <div className="login-card">
              <div className="login-header">
                <h2 className="login-title">Connexion</h2>
                <p className="login-subtitle">Accédez à votre compte</p>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="votre.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mot de passe</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="•••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Se souvenir de moi</span>
                  </label>
                 {/* <Link to="/forgot-password" className="forgot-link">
                    Mot de passe oublié ?
                  </Link>*/}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  Pas encore de compte ?{" "}
                  <Link to="/register" className="register-link">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
