// src/components/ProfileMenu.js
import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

const ProfileMenu = ({ currentUser, anchorEl, onClose }) => {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    navigate(`/profile/${currentUser.uid}`);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <MenuItem onClick={handleGoToProfile}>Perfil</MenuItem>
      <MenuItem onClick={() => navigate("/plans")}>Planos</MenuItem>
      <MenuItem onClick={() => navigate("/donations")}>Doações</MenuItem>
      <MenuItem onClick={() => navigate("/my-donations")}>Minhas doações</MenuItem>
      <MenuItem onClick={handleLogout}>Sair</MenuItem>
    </Menu>
  );
};

export default ProfileMenu;
