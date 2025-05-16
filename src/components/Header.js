import React, { useState } from "react";
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

  // Estados para hover
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredNotification, setHoveredNotification] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState(false);

  React.useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser.uid),
      where("status", "in", ["unread", "pending"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    <header style={styles.header}>
    <Link to="/" style={styles.logo}>
      <img
        src={require("../icons/logo.png")}
        alt="DoaFácil Logo"
        style={styles.logoImage || { width: 60, height: 60, marginRight: 10, verticalAlign: "middle" }}
      />
      <span style={{ marginLeft: 8, verticalAlign: "middle" }}>DoaFácil</span>
    </Link>
      <nav>
        <ul style={styles.navList}>
          {[
            { name: "Doações", path: "/donations" },
            { name: "Doar", path: "/add-donation" },
            { name: "Chat", path: "/chat" },
            { name: "Mapa", path: "/map" },
            { name: "Notificações", path: "/notifications" },
          ].map((item, index) => (
            <li
              key={index}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...styles.navItem,
                transform: hoveredItem === index ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            >
              <Link to={item.path} style={styles.navLink}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div style={styles.rightSection}>
        {currentUser ? (
          <>
            {/* Notificações */}
            <Link
              to="/notifications"
              style={{
                ...styles.notificationContainer,
                transform: hoveredNotification ? "scale(1.1) rotate(-3deg)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={() => setHoveredNotification(true)}
              onMouseLeave={() => setHoveredNotification(false)}
            >
              <img src={notificationIcon} alt="Notificações" style={styles.notificationIcon} />
              {notificationsCount > 0 && (
                <span style={styles.notificationBadge}>
                  {notificationsCount >= 10 ? "10+" : notificationsCount}
                </span>
              )}
            </Link>

            {/* Foto de perfil */}
            <div style={{ position: "relative" }}>
              <img
                src={currentUser.photoURL || "/icons/default-profile.png"}
                alt="Perfil"
                style={{
                  ...styles.profileImage,
                  boxShadow: hoveredProfile ? "0 0 12px rgba(255, 255, 255, 0.6)" : "none",
                  transform: hoveredProfile ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={() => setHoveredProfile(true)}
                onMouseLeave={() => setHoveredProfile(false)}
                onClick={handleProfileClick}
              />
              <ProfileMenu currentUser={currentUser} anchorEl={anchorEl} onClose={handleProfileMenuClose} />
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
    </header>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderRadius: "0 0 12px 12px",
    transition: "all 0.3s ease-in-out",
  },
  logo: {
    textDecoration: "none",
    color: "#fff",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "1px",
    transition: "color 0.3s",
  },
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
  profileImage: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    cursor: "pointer",
    objectFit: "cover",
    border: "2px solid rgba(255, 255, 255, 0.5)",
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
};

export default Header;
