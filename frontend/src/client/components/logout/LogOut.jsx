/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react"; // Missing useState import
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

export default function LogOut() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate()
  useEffect(() => {
    logout();
    navigate("/login")
  }, []);

return (
    <>Logout</>
)
}