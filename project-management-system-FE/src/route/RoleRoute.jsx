import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";

const RoleRoute = ({ children, allowedRoles }) => {
  const { auth } = useContext(AuthContext);

  if (!allowedRoles.includes(auth?.user?.role)) {
    return <Navigate to="/403" />;
  }

  return children;
};

export default RoleRoute;