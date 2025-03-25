// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import notificationIcon from "../icons/notification.png";
import { useAuth } from "../AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const Header = () => {
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser.uid),
      where("status", "in", ["unread", "pending"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Notificações encontradas:", snapshot.docs.length);
      setNotificationsCount(snapshot.docs.length);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleProfileClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        background: "transparent",
      }}
    >
      <div>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#000",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          DoaFácil
        </Link>
      </div>
      <nav>
        <ul
          style={{
            display: "flex",
            listStyleType: "none",
            margin: 0,
            padding: 0,
            gap: "20px",
          }}
        >
          <li>
            <Link to="/donations" style={{ textDecoration: "none", color: "#000" }}>
              Doações
            </Link>
          </li>
          <li>
            <Link to="/add-donation" style={{ textDecoration: "none", color: "#000" }}>
              Fazer uma doação
            </Link>
          </li>
          <li>
            <Link to="/chat" style={{ textDecoration: "none", color: "#000" }}>
              Chat
            </Link>
          </li>
          <li>
            <Link to="/map" style={{ textDecoration: "none", color: "#000" }}>
              Mapa
            </Link>
          </li>
        </ul>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {currentUser ? (
          <>
            {/* Ícone de notificações com badge */}
            <Link to="/notifications">
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={notificationIcon}
                  alt="Notificações"
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    objectFit: "cover",
                  }}
                />
                {notificationsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "0px",
                      background: "red",
                      color: "#fff",
                      borderRadius: "50%",
                      padding: "2px 5px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      minWidth: "20px",
                      textAlign: "center",
                      lineHeight: "1",
                      zIndex: 10,
                    }}
                  >
                    {notificationsCount >= 10 ? "10+" : notificationsCount}
                  </span>
                )}
              </div>
            </Link>
            <div style={{ position: "relative" }}>
              <img
                src={currentUser.photoURL || "/icons/default-profile.png"}
                alt="Perfil"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
                onClick={handleProfileClick}
              />
              <ProfileMenu
                currentUser={currentUser}
                anchorEl={anchorEl}
                onClose={handleProfileMenuClose}
              />
            </div>
          </>
        ) : (
          <div>
            <Link
              to="/login"
              style={{ marginRight: "10px", textDecoration: "none", color: "#000" }}
            >
              Logar
            </Link>
            <Link to="/register" style={{ textDecoration: "none", color: "#000" }}>
              Criar Conta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
