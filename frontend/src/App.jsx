import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DashboardPosts from "./pages/dashboard/DashboardPosts";
import DashboardNotifications from "./pages/dashboard/DashboardNotifications";
import DashboardExplore from "./pages/dashboard/DashboardExplore";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import PublicProfile from "./pages/PublicProfile";
import Notifications from "./pages/Notifications";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { SocketProvider } from "./contexts/SocketContext";
import { CreatePostModalProvider } from "./contexts/CreatePostModalContext";
import CreatePostModal from "./components/CreatePostModal";
import Toast from "./components/Toast";
import "./styles/DarkTheme.css";

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="posts" replace />} />
          <Route path="posts" element={<DashboardPosts />} />
          <Route path="posts/:id" element={<DashboardPosts />} />
          <Route path="notifications" element={<DashboardNotifications />} />
          <Route path="explore" element={<DashboardExplore />} />
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SocketProvider>
          <CreatePostModalProvider>
            <Router>
              <AppContent />
              <Toast />
              <CreatePostModal />
            </Router>
          </CreatePostModalProvider>
        </SocketProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
