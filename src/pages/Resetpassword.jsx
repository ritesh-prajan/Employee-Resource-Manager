import React, { useState } from "react";
import { Lock, CheckCircle, Check, X, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from 'motion/react';
import { authService } from "#services/authService.js";

const Resetpassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let strength = "none";
    let color = "bg-muted";
    let width = "0%";

    if (score > 0) {
      if (score <= 1) {
        strength = "weak";
        color = "bg-destructive";
        width = "25%";
      } else if (score <= 2) {
        strength = "fair";
        color = "bg-amber-500";
        width = "50%";
      } else if (score <= 3) {
        strength = "good";
        color = "bg-primary";
        width = "75%";
      } else {
        strength = "strong";
        color = "bg-emerald-500";
        width = "100%";
      }
    }

    return {
      requirements,
      score,
      strength,
      color,
      width,
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and a number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
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

    // Clear specific field error when user starts typing
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
      
     await authService.resetpassword(formData.confirmPassword,token
     )
      setIsSuccess(true);
    } catch (err) {
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
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
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500">
              <CheckCircle className="h-7 w-7" />
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-foreground tracking-tight">
            Password Updated
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed mb-6">
            Your password has been successfully updated. You can now use your new password to sign in.
          </p>

          <Link to="/login">
            <button className="w-full btn btn-primary py-3 rounded-xl shadow-md">
              Back to Sign In
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8"
      >
        <div className="flex justify-center mb-6">
          <span style={{ color: "var(--primary)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>e</span>
          <span style={{ color: "var(--foreground)", fontWeight: 850, fontSize: "2rem", letterSpacing: "-0.75px" }}>LITE</span>
        </div>

        <h1 className="text-[22px] font-bold text-foreground text-center tracking-tight">
          Update Password
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground text-center leading-relaxed mb-6">
          Enter your new password below to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="p-3 text-[13px] text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {errors.general}
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
               
              </span>
              <input
                id="password"
                type="password"
                
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
                required
                className="input-control w-full pl-10 py-2.5 text-[14px]"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[13px] text-destructive">{errors.password}</p>
            )}

            {/* Password strength indicator */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Password Strength</span>
                  <span className="capitalize">{passwordStrength.strength}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                {/* Requirements list */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.requirements.length ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <X className="h-3 w-3 text-destructive" />
                    )}
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.requirements.uppercase ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <X className="h-3 w-3 text-destructive" />
                    )}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.requirements.lowercase ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <X className="h-3 w-3 text-destructive" />
                    )}
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.requirements.number ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <X className="h-3 w-3 text-destructive" />
                    )}
                    <span>Number (0-9)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                
              </span>
              <input
                id="confirmPassword"
                type="password"
                
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                disabled={isLoading}
                required
                className="input-control w-full pl-10 py-2.5 text-[14px]"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-[13px] text-destructive">{errors.confirmPassword}</p>
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Updating Password...
              </span>
            ) : (
              "Update Password"
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

export default Resetpassword;