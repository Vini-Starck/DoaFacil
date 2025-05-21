// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import notificationIcon from "../icons/notification.png";
import { useAuth } from "../AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const navItems = [
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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const renderNavList = () => (
    <ul style={styles.navList}>
      {navItems.map((item, idx) => (
        <li
          key={idx}
          style={styles.navItem}
          onMouseEnter={() => setHoverNav(idx)}
          onMouseLeave={() => setHoverNav(null)}
        >
          <Link
            to={item.path}
            style={{
              ...styles.navLink,
              transform: hoverNav === idx ? "scale(1.1)" : "scale(1)",
            }}
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header style={styles.header}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        <img
          src={require("../icons/logo.png")}
          alt="DoaFácil Logo"
          style={styles.logoImage}
        />
        <span style={styles.logoText}>DoaFácil</span>
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

      {/* Áreas à direita */}
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
                src={
                  currentUser.photoURL || "/icons/default-profile.png"
                }
                alt="Perfil"
                style={{
                  ...styles.profileImage,
                  transform: hoverProf ? "scale(1.1)" : "scale(1)",
                  boxShadow: hoverProf
                    ? "0 0 12px rgba(255,255,255,0.6)"
                    : "none",
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
            <Link to="/login" style={styles.authLink}>
              Logar
            </Link>
            <Link to="/register" style={styles.authLink}>
              Criar Conta
            </Link>
          </div>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <nav style={styles.mobileMenu}>
          {renderNavList()}
        </nav>
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
    background: "rgba(255,255,255,0.1)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderRadius: "0 0 12px 12px",
    transition: "all 0.3s ease-in-out",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#fff",
  },
  logoImage: { width: 50, height: 50, marginRight: 8 },
  logoText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  navList: {
    display: "flex",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "20px",
  },
  navItem: {
    position: "relative",
  },
  navLink: {
    textDecoration: "none",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "500",
    padding: "10px 14px",
    borderRadius: "6px",
    transition: "transform 0.3s, background 0.3s",
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
    background: "red",
    color: "#fff",
    borderRadius: "50%",
    padding: "3px 6px",
    fontSize: "12px",
    fontWeight: "bold",
    minWidth: "20px",
    textAlign: "center",
    lineHeight: "1",
    animation: "pulse 1.5s infinite",
  },
  profileWrapper: {
    position: "relative",
  },
  profileImage: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    cursor: "pointer",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.5)",
  },
  authButtons: {
    display: "flex",
    gap: "12px",
  },
  authLink: {
    textDecoration: "none",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "500",
    transition: "color 0.3s, box-shadow 0.3s",
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
    background: "#fff",
    transition: "transform 0.3s",
  },
  mobileMenu: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.7)",
    padding: "10px 0",
    zIndex: 99,
  },
};

export default Header;
