import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useLangStore } from '../langStore';
import { translations } from '../i18n';
import {
  LayoutDashboard,
  Mic,
  History,
  BarChart2,
  LogOut,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { lang, toggle, theme, toggleTheme } = useLangStore();
  const T = translations[lang];
  const navigate = useNavigate();

  const nav = [
    { to: '/dashboard', label: T.nav_dashboard, icon: LayoutDashboard },
    { to: '/practice', label: T.nav_practice, icon: Mic },
    { to: '/history', label: T.nav_history, icon: History },
    { to: '/analytics', label: T.nav_analytics, icon: BarChart2 },
  ];

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sidebar-brand shadow-sm">
            <Mic size={15} className="text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
            InterviewAI
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            <Languages size={16} className="text-gray-400 dark:text-gray-500" />
            {T.lang_switch}
          </button>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-gray-400 dark:text-gray-500" />
            ) : (
              <Moon size={16} className="text-gray-400" />
            )}
            {T.theme_toggle}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            <LogOut size={16} className="text-gray-400 dark:text-gray-500" />
            {T.nav_signout}
          </button>
          <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">
                {user?.full_name}
              </p>
              <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
