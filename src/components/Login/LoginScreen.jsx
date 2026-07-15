import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./LoginScreen.css";

export default function LoginScreen({ theme, onToggleTheme }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(username, password);
    } catch (error) {
      alert("Credenciales incorrectas");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-side">
        <img src="/bg-login.png" alt="" className="login-side-img" />
      </div>
      <div className="login-box">
        <button
          className="btn-icon login-theme-toggle"
          onClick={onToggleTheme}
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <h1>Préstamos de Mar</h1>
        <input
          className="input"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn" onClick={handleLogin}>
          Entrar
        </button>
      </div>
    </div>
  );
}
