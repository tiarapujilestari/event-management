import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success("Welcome back!");
      navigate((location.state as any)?.from || "/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome!");
      navigate((location.state as any)?.from || "/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Google sign-in failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 card"
      >
        <h1 className="mb-1 text-2xl font-extrabold">Welcome back</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Log in to book tickets and manage your events.
        </p>

        {/* Social sign-in */}
        <div className="mb-4 space-y-2">
          {googleSubmitting ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 py-2.5 text-sm text-neutral-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in with
              Google...
            </div>
          ) : (
            <GoogleSignInButton onCredential={handleGoogleCredential} />
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                {...register("email")}
                placeholder="Email"
                className="input !pl-10"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                {...register("password")}
                placeholder="Password"
                className="input !pl-10"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("rememberMe")} /> Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-brand-500 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Log in
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-neutral-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-500 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
