"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/ResetPassword.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de réinitialisation manquant");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword: password, // ✅ Le backend attend "newPassword"
      });

      if (response.data.success) {
        setSuccess("Mot de passe réinitialisé avec succès !");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la réinitialisation du mot de passe"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <h2 className="reset-title">Nouveau mot de passe</h2>
          <p className="reset-subtitle">Entrez votre nouveau mot de passe</p>
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

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="field-group">
            <label className="field-label">Nouveau mot de passe</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 caractères"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Confirmer le mot de passe</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirmez votre mot de passe"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="submit-button"
          >
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>

        <div className="reset-back-link">
          <a href="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}
