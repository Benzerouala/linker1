"use client";

import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Register.css";
import HomeNavbar from "../components/HomeNavbar";
import API_URL from "../utils/api";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      const response = await axios.post(
        `${API_URL}/auth/register`,
        registerData,
      );
      if (response.data.success) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        const validationErrors = err.response.data.errors
          .map((e) => e.message)
          .join(", ");
        setError(validationErrors);
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.errors?.[0]?.message ||
            "Erreur lors de l'inscription",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <HomeNavbar />
      <div className="register-page">
        <div className="register-container">
          <div className="register-form-wrapper">
            <div className="form-card">
              <div className="form-header">
                <h2 className="form-title">Créer un compte</h2>
                <p className="form-subtitle">Rejoignez Linker</p>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-fields">
                <div className="field-group">
                  <label className="field-label">Nom complet</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Mon Nom Complet"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Nom d'utilisateur</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="monnomdutilisateur"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Email</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="votre.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Mot de passe</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password-btn"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Confirmation du mot de passe
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="toggle-password-btn"
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Inscription en cours...
                    </>
                  ) : (
                    "Créer mon compte"
                  )}
                </button>
              </form>

              <div className="register-footer">
                <p>
                  Déjà membre ?{" "}
                  <Link to="/login" className="footer-link">
                    Se connecter
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
