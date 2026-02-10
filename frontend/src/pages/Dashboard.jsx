//frontend/src/pages/Dashboard.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Outlet } from "react-router-dom";
import "../styles/Dashboard.css";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import MobileBottomNavbar from "../components/MobileBottomNavbar";
import NotificationsSidebarRight from "../components/NotificationsSidebarRight";
import "../styles/NotificationManager.css";
import API_URL from "../utils/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUser(response.data.data);
          localStorage.setItem("userId", response.data.data.id);
        }
      } catch (err) {
        setError("Erreur lors du chargement du profil");
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth-change"));
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dashboard-error">
        <p>{error || "Utilisateur non trouvé"}</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="dashboard-wrapper">
        <TopNavbar />
        <div className="dashboard-layout">
          <div className="dashboard-container">
            <Outlet context={{ user, setUser }} />
          </div>
          <NotificationsSidebarRight />
        </div>
      </div>
      <MobileBottomNavbar />
    </>
  );
}