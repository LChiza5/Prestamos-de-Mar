import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { SunIcon, MoonIcon, UserIcon, LockIcon } from "../icons/Icons";
import "./LoginScreen.css";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LoginScreen({ theme, onToggleTheme }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // A client-side deterrent against rapid-fire guessing, on top of (not
  // instead of) Firebase Auth's own server-side abuse protection, which
  // can't be bypassed just by reloading the page the way this local
  // lockout can.
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = Boolean(lockedUntil);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      await login(username, password);
      setFailedAttempts(0);
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
      } else {
        alert("Credenciales incorrectas");
      }
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
            disabled={isLocked}
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
            disabled={isLocked}
          />
        </div>
        {isLocked ? (
          <p className="error login-lockout-message">
            Demasiados intentos fallidos. Espera {secondsLeft}s para
            volver a intentar.
          </p>
        ) : (
          failedAttempts > 0 && (
            <p className="error login-lockout-message">
              Credenciales incorrectas ({MAX_ATTEMPTS - failedAttempts}{" "}
              intento(s) antes del bloqueo temporal)
            </p>
          )
        )}
        <button className="btn login-submit-btn" type="submit" disabled={isLocked}>
          {isLocked ? `Bloqueado (${secondsLeft}s)` : "Entrar"}
        </button>
      </form>
    </div>
  );
}
