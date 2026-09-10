import React, { useState, useMemo } from "react";
import LoginScreen from "./LoginScreen";
import RecipesApp from "./RecipesApp";
import AdminApp from "./AdminApp";
import TrialExpired from "./TrialExpired";

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
  const [expired, setExpired] = useState(false);

  const user = useMemo(() => {
    return token ? decodeToken(token) : null;
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setExpired(false);
  };

  // Se llama cuando el servidor responde 403 con código TRIAL_EXPIRED.
  const onExpired = () => {
    localStorage.removeItem("token");
    setToken(null);
    setExpired(true);
  };

  if (expired) {
    return <TrialExpired onBack={() => setExpired(false)} />;
  }

  if (!token) {
    return <LoginScreen setToken={setToken} onExpired={onExpired} />;
  }

  if (user?.role === "admin") {
    return <AdminApp token={token} logout={logout} />;
  }

  return <RecipesApp token={token} logout={logout} onExpired={onExpired} />;
};

export default App;
