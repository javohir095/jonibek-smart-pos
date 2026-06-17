import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const login = useAppStore((s) => s.login);
  const settings = useAppStore((s) => s.settings);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const result = login(username.trim(), password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Xatolik yuz berdi');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark">
            <i className="fas fa-cash-register"></i>
          </span>
          <h1>{settings.storeName}</h1>
          <p>Boshqaruv tizimiga kirish</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Foydalanuvchi nomi</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="masalan: admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
