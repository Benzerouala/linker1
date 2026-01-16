
"use client";

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email,
      });

      if (response.data.success) {
        setSuccess(
          "Un email de réinitialisation a été envoyé à votre adresse."
        );
        setTimeout(() => {
          navigate(`/login`);
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la demande de réinitialisation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-header">
          <h2 className="forgot-title">Mot de passe oublié</h2>
          <p className="forgot-subtitle">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-form">
          <div className="field-group">
            <label className="field-label">Email</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre.email@example.com"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <div className="forgot-back-link">
          <a href="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}
