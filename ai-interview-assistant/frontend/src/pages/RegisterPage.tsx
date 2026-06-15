import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, login, getMe } from "../api";
import { useAuthStore } from "../store";
import { useLangStore } from "../langStore";
import { translations } from "../i18n";
import { Mic, CheckCircle, Moon, Sun } from "lucide-react";

const FEATURES = [
  "AI-powered answer analysis",
  "Real-time clarity & confidence scoring",
  "Track progress over time",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const { lang, toggle, theme, toggleTheme } = useLangStore();
  const T = translations[lang];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, fullName, password);
      const tokens = await login(email, password);
      const user = await getMe();
      storeLogin(user, tokens.access_token, tokens.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || T.err_register);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-auth-panel p-12 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Mic size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">InterviewAI</span>
        </div>
        <div className="mt-auto z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4">Practice makes<br />perfect</h2>
          <p className="text-indigo-200 text-[15px] mb-10 leading-relaxed">Join thousands of candidates who use AI coaching to land their dream role.</p>
          <div className="space-y-3.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <CheckCircle size={12} className="text-white" />
                </div>
                <span className="text-[14px] text-indigo-100">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-900 px-8 py-12">
        <div className="w-full max-w-sm fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T.register_title}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{T.register_subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={toggle} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {T.lang_switch}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{T.field_fullname}</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-800" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{T.field_email}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-800" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{T.field_password}</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={T.field_pw_hint}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-800" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {T.btn_register_loading}
                </span>
              ) : T.btn_register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {T.link_has_account}{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">{T.link_signin}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
