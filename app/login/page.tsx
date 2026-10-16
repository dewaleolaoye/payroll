"use client";
import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  SignInIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useApp } from "@/features/app/AppProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { accounts, defaultPassword } from "@/lib/auth/accounts";
export default function Login() {
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeToggle />
      </div>
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
                : "That email and password don’t match an account.",
            );
          }}
        >
          <div className="account-picker">
            <div className="account-caption">ACCOUNTS</div>
            <div className="account-grid">
              {accounts.map(({ actor, email: accountEmail }) => (
                <button
                  key={actor.id}
                  type="button"
                  className={`account-option ${email === accountEmail ? "selected" : ""}`}
                  aria-pressed={email === accountEmail}
                  onClick={() => {
                    setEmail(accountEmail);
                    setPassword(defaultPassword);
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
          <label>
            Work email
            <input
              type="email"
              autoComplete="username"
              placeholder="name@nlng.local"
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
        </form>
      </div>
    </div>
  );
}
