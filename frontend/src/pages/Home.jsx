"use client";

import { useState, useEffect } from "react";
import Feed from "../components/Feed";
import HomeNavbar from "../components/HomeNavbar";
import "../styles/Home.css";
export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Rediriger vers dashboard si déjà connecté
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="home-page">
      <HomeNavbar />
      {/* Feed Public */}
      <div className="home-feed-container">
        <Feed type="explore" />
      </div>
    </div>
  );
}
