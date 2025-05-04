/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react"; // Missing useState import
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, authenticated } = useContext(AuthContext);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  if (!checked) {
    return null; // or a loading spinner while checking auth status
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />; // Added replace prop
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}