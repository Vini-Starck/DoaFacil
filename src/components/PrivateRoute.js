import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // Supondo que há um contexto de autenticação

const PrivateRoute = ({ element }) => {
  const { currentUser } = useAuth(); // Obtém o usuário autenticado

  return currentUser ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;
