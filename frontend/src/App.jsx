import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

// Context Providers

// Store Hooks
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

// Layout Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();


  // Initialize theme and check authentication on mount
  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute("data-theme", theme);
    checkAuth();
  }, [checkAuth, theme]);

  // Request browser notification permission after login
  useEffect(() => {
    if (authUser && window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [authUser]);

  // Show loading state while checking authentication
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  // Routes that don't show sidebar/navbar
  const publicRoutes = [
    '/login',
    '/signup'
  ];

  const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));

  return (
    <div className={`h-screen ${theme}`} data-theme={theme}>
      <Toaster position="top-center" />
      <div className="flex h-screen">
        {authUser && <Sidebar />}
        <div className="flex-1 overflow-auto ml-80">
          <Routes>
            <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
export default App;
