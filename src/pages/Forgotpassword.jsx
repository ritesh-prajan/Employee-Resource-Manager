import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { motion } from "framer-motion";

const Forgotpassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.forgotpassword(formData.email);
      setIsSuccess(true);
    } catch (err) {
      setErrors({ general: err.message || "Failed to send reset link. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border p-8 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500">
              <CheckCircle className="h-7 w-7" />
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-foreground tracking-tight">
            Check Your Email
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed mb-6">
            We've sent a password reset link to <strong>{formData.email}</strong>. Please check your inbox (and spam folder) for instructions.
          </p>

          <button
            onClick={() => {
              setIsSuccess(false);
              setFormData({ email: "" });
            }}
            className="w-full btn btn-outline py-2.5 rounded-xl text-[14px]"
          >
            Send Another Reset Link
          </button>

          <div className="mt-6 border-t border-border pt-4">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-[13px] font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border p-8"
      >
        <div className="flex justify-center mb-6">
          <span style={{ color: "var(--primary)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>e</span>
          <span style={{ color: "var(--foreground)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>LITE</span>
        </div>

        <h1 className="text-[22px] font-bold text-foreground text-center tracking-tight">
          Reset Password
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground text-center leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {errors.general && (
            <div className="p-3 text-[13px] text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              
              <input
                id="email"
                type="email"
              
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
                required
                className="input-control w-full pl-10 py-2.5 text-[14px]"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-[13px] text-destructive">{errors.email}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 mt-2 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending Reset Link...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </motion.button>
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-[13px] font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Forgotpassword;