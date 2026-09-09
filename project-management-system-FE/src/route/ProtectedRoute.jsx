import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";

const ProtectedRoute = ({ children }) => {
  const { auth, isAppLoading } = useContext(AuthContext);

  if (isAppLoading) return <div>Loading...</div>;

  if (!auth?.isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;