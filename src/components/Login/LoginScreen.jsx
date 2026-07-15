import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { SunIcon, MoonIcon, UserIcon, LockIcon } from "../icons/Icons";
import "./LoginScreen.css";

export default function LoginScreen({ theme, onToggleTheme }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      alert("Credenciales incorrectas");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <img src="/bg-login.png" alt="" className="login-bg-img" />
      <div className="login-scrim" />

      <button
        className="btn-icon theme-toggle-btn login-theme-toggle"
        onClick={onToggleTheme}
        title={theme === "light" ? "Modo oscuro" : "Modo claro"}
        aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
      >
        {theme === "light" ? (
          <MoonIcon key="moon" className="theme-icon" />
        ) : (
          <SunIcon key="sun" className="theme-icon" />
        )}
      </button>

      <form className="login-box" onSubmit={handleLogin}>
        <h1 className="login-title">Préstamos de Mar</h1>
        <div className="input-icon-wrap">
          <UserIcon className="input-icon" />
          <input
            className="input input-with-icon"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="input-icon-wrap">
          <LockIcon className="input-icon" />
          <input
            className="input input-with-icon"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn login-submit-btn" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
