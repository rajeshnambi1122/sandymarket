import { Navigate } from "react-router-dom";

import { AdminRouteProps } from "@/types/index";

export function AdminRoute({ children }: AdminRouteProps) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (user.role !== "admin" && user.role !== "admin1") {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return <Navigate to="/login" replace />;
  }
}
