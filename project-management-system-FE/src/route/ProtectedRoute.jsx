import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
import CircleLoading from "../components/animation-loading";

const ProtectedRoute = ({ children }) => {
  const { auth, isAppLoading } = useContext(AuthContext);

  if (isAppLoading)
    return (
      <div className="flex justify-center items-center">
        <CircleLoading />
      </div>
    );

  if (!auth?.isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;
