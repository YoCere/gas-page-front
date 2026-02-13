import React, { useState, useMemo } from "react";
import LoginScreen from "./LoginScreen";
import RecipesApp from "./RecipesApp";
import AdminApp from "./AdminApp";

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const user = useMemo(() => {
    return token ? decodeToken(token) : null;
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <LoginScreen setToken={setToken} />;
  }

  if (user?.role === "admin") {
    return <AdminApp token={token} logout={logout} />;
  }

  return <RecipesApp token={token} logout={logout} />;
};

export default App;
