"use client";
import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  SignInIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useSimulation } from "@/features/simulation/SimulationProvider";
import { accounts, demoPassword } from "@/lib/auth/accounts";
export default function Login() {
  const { signIn } = useSimulation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-brand">
          <img src="/nlng-logo.avif" alt="NLNG" />
          <span>
            People & Payroll<small>WORKFORCE MANAGEMENT</small>
          </span>
        </div>
        <h1>Welcome back</h1>
        <p className="login-lead">Sign in to People & Payroll.</p>
        <form
          className="login-card"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setError(
              signIn(email, password)
                ? ""
                : "That email and password don’t match a demo account.",
            );
          }}
        >
          <label>
            Work email
            <input
              type="email"
              autoComplete="username"
              placeholder="name@nlng.demo"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </span>
          </label>
          {error && (
            <div className="login-error" role="alert">
              <WarningCircleIcon size={17} />
              {error}
            </div>
          )}
          <button className="button login-submit" type="submit">
            <SignInIcon size={17} />
            Sign in
          </button>
          <div className="demo-accounts">
            <div className="demo-caption">DEMO ACCOUNTS</div>
            <div className="demo-grid">
              {accounts.map(({ actor, email: demoEmail }) => (
                <button
                  key={actor.id}
                  type="button"
                  className={`demo-card ${email === demoEmail ? "selected" : ""}`}
                  aria-pressed={email === demoEmail}
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword(demoPassword);
                    setError("");
                  }}
                >
                  <span className="avatar small">{actor.initials}</span>
                  <span>
                    <strong>{actor.name}</strong>
                    <small>{actor.role}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
        <p className="login-foot">
          Synthetic demo accounts · password{" "}
          <span className="mono">{demoPassword}</span>
        </p>
      </div>
    </div>
  );
}
