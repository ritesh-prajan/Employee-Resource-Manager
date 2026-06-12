import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const navigate = useNavigate();
  

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      switch (user.role) {
        case 'Admin':     navigate('/admin/dashboard'); break;
        case 'Team Lead':
        case 'Sub Lead':  navigate('/lead/dashboard');  break;
        default:          navigate('/dashboard');        break;
      }
    } catch (err) {
      const msg = err?.message?.toLowerCase() ?? '';
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid')) {
          setError('Incorrect email or password. Please try again.');
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          setError('Your account has been disabled. Contact your admin.');
        } else if (msg.includes('network') || msg.includes('failed to fetch')) {
          setError('Cannot reach server. Check your connection.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center px-4">

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border p-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <span style={{ color: "var(--primary)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>e</span>
          <span style={{ color: "var(--foreground)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>LITE</span>
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold text-foreground text-center tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground text-center leading-relaxed">
          Log in to your eLITE account to manage schedules, track time, and keep your team on track.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              placeholder="name@office.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="input-control w-full py-2.5 text-[14px]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgotpassword"
                className="text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              className="input-control w-full py-2.5 text-[14px]"
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 mt-1 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          © 2026 Elite Software Solutions
        </p>
      </motion.div>
    </div>
  );
}