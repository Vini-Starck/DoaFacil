// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import notificationIcon from "../icons/notification.png";
import { useAuth } from "../AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import Logo_Doa_Facil from "../icons/Logo_Doa_Facil.png";
import defaultProfilePic from "../icons/default-profile.png";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Como usar", path: "/como-usar" },
  { name: "Doações", path: "/donations" },
  { name: "Doar", path: "/add-donation" },
  { name: "Chat", path: "/chat" },
  { name: "Mapa", path: "/map" },
  { name: "Notificações", path: "/notifications" },
];

const Header = () => {
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [hoverNav, setHoverNav] = useState(null);
  const [hoverNotif, setHoverNotif] = useState(false);
  const [hoverProf, setHoverProf] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta se estamos em mobile (< 768px)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Contador de notificações
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser.uid),
      where("status", "in", ["unread", "pending"])
    );
    return onSnapshot(q, snap => setNotifCount(snap.docs.length));
  }, [currentUser]);

  const handleProfileClick = e => setAnchorEl(e.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);
  const toggleMenu = () => setMenuOpen(o => !o);

  // Renderiza a lista de navegação com estilo condicional
  const renderNavList = () => {
    const listStyle = isMobile ? styles.mobileNavList : styles.navList;
    return (
      <ul style={listStyle}>
        {navItems.map((item, idx) => {
          // estilo base do link
          const baseLinkStyle = {
            ...styles.navLink,
            background:
              hoverNav === idx
                ? "linear-gradient(90deg, #28a745 60%, #007bff 100%)"
                : "transparent",
            color: hoverNav === idx ? "#fff" : "#222",
            transform: hoverNav === idx ? "scale(1.08)" : "scale(1)",
            boxShadow:
              hoverNav === idx
                ? "0 2px 8px rgba(40,167,69,0.10)"
                : "none",
          };

          // overrides para mobile
          const mobileLinkStyle = isMobile
            ? {
                ...baseLinkStyle,
                display: "block",
                width: "100%",
                padding: "12px 16px",
                borderRadius: 0,
                textAlign: "center",
              }
            : baseLinkStyle;

          return (
            <li
              key={idx}
              style={styles.navItem}
              onMouseEnter={() => setHoverNav(idx)}
              onMouseLeave={() => setHoverNav(null)}
            >
              <Link to={item.path} style={mobileLinkStyle}>
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <header style={styles.header}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        <img
          src={Logo_Doa_Facil}
          alt="DoaFácil Logo"
          style={styles.logoImage}
        />
      </Link>

      {/* Nav ou Hamburger */}
      {isMobile ? (
        <div style={styles.hamburger} onClick={toggleMenu}>
          <div style={styles.bar} />
          <div style={styles.bar} />
          <div style={styles.bar} />
        </div>
      ) : (
        <nav>{renderNavList()}</nav>
      )}

      {/* Área direita: notificações + perfil ou botões de auth */}
      <div style={styles.rightSection}>
        {currentUser ? (
          <>
            <Link
              to="/notifications"
              style={{
                ...styles.notificationContainer,
                transform: hoverNotif ? "scale(1.1) rotate(-3deg)" : "scale(1)",
              }}
              onMouseEnter={() => setHoverNotif(true)}
              onMouseLeave={() => setHoverNotif(false)}
            >
              <img
                src={notificationIcon}
                alt="Notificações"
                style={styles.notificationIcon}
              />
              {notifCount > 0 && (
                <span style={styles.notificationBadge}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
            <div style={styles.profileWrapper}>
              <img
                src={currentUser.photoURL || defaultProfilePic}
                alt="Perfil"
                style={{
                  ...styles.profileImage,
                  transform: hoverProf ? "scale(1.1)" : "scale(1)",
                  boxShadow: hoverProf
                    ? "0 0 12px rgba(40,167,69,0.18)"
                    : "0 2px 8px rgba(40,167,69,0.10)",
                }}
                onMouseEnter={() => setHoverProf(true)}
                onMouseLeave={() => setHoverProf(false)}
                onClick={handleProfileClick}
              />
              <ProfileMenu
                currentUser={currentUser}
                anchorEl={anchorEl}
                onClose={handleProfileClose}
              />
            </div>
          </>
        ) : (
          <div style={styles.authButtons}>
            <Link
              to="/login"
              style={{
                ...styles.authLink,
                opacity: hoverNav === "login" ? 0.85 : 1,
                transform: hoverNav === "login" ? "scale(1.06)" : "scale(1)",
                boxShadow:
                  hoverNav === "login"
                    ? "0 4px 16px rgba(40,167,69,0.15)"
                    : styles.authLink.boxShadow,
              }}
              onMouseEnter={() => setHoverNav("login")}
              onMouseLeave={() => setHoverNav(null)}
            >
              Logar
            </Link>
            <Link
              to="/register"
              style={{
                ...styles.authLink,
                opacity: hoverNav === "register" ? 0.85 : 1,
                transform:
                  hoverNav === "register" ? "scale(1.06)" : "scale(1)",
                boxShadow:
                  hoverNav === "register"
                    ? "0 4px 16px rgba(40,167,69,0.15)"
                    : styles.authLink.boxShadow,
              }}
              onMouseEnter={() => setHoverNav("register")}
              onMouseLeave={() => setHoverNav(null)}
            >
              Criar Conta
            </Link>
          </div>
        )}
      </div>

      {/* Dropdown em mobile */}
      {isMobile && menuOpen && (
        <nav style={styles.mobileMenu}>{renderNavList()}</nav>
      )}
    </header>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#fff",
    boxShadow: "0 4px 16px rgba(40,167,69,0.10)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderRadius: "0 0 12px 12px",
    transition: "all 0.3s ease-in-out",
    border: "2px solid #111",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#28a745",
  },
  logoImage: {
    height: 40,
    marginRight: 8,
    resizeMode: "contain",
  },
  navList: {
    display: "flex",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "20px",
  },
  mobileNavList: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "4px",
  },
  navItem: {
    position: "relative",
  },
  navLink: {
    textDecoration: "none",
    color: "#222",
    fontSize: "16px",
    fontWeight: "500",
    padding: "10px 14px",
    borderRadius: "6px",
    transition: "transform 0.3s, background 0.3s, color 0.3s",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  notificationContainer: {
    position: "relative",
    display: "inline-block",
  },
  notificationIcon: {
    width: "28px",
    height: "28px",
    cursor: "pointer",
    objectFit: "cover",
  },
  notificationBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "#dc3545",
    color: "#fff",
    borderRadius: "50%",
    padding: "3px 6px",
    fontSize: "12px",
    fontWeight: "bold",
    minWidth: "20px",
    textAlign: "center",
    lineHeight: "1",
    boxShadow: "0 2px 8px rgba(220,53,69,0.15)",
  },
  profileWrapper: {
    position: "relative",
  },
  authButtons: {
    display: "flex",
    gap: "10px",
  },
  authLink: {
    textDecoration: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "bold",
    padding: "10px 20px",
    borderRadius: "6px",
    background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)",
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
    transition: "opacity 0.2s, box-shadow 0.2s, background 0.3s, color 0.3s, transform 0.2s",
    border: "none",
    outline: "none",
    display: "inline-block",
    letterSpacing: 0.5,
  },
  hamburger: {
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    gap: 4,
  },
  bar: {
    width: 25,
    height: 3,
    background: "#28a745",
    transition: "transform 0.3s",
    borderRadius: 2,
  },
  mobileMenu: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    background: "#fff",
    padding: "10px 0",
    zIndex: 99,
    boxShadow: "0 4px 16px rgba(40,167,69,0.10)",
    borderRadius: "0 0 12px 12px",
  },
  profileImage: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    cursor: "pointer",
    objectFit: "cover",
    border: "2px solid #111",
    background: "#fafbfc",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
};

export default Header;
