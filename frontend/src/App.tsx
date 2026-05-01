import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./stores/auth-store"

// Layouts
import AppShell from "./components/layout/app-shell"
import AuthLayout from "./components/layout/auth-layout"

// Pages
import LandingPage from "./pages/landing"
import LoginPage from "./pages/auth/login"
import SignupPage from "./pages/auth/signup"
import ForgotPasswordPage from "./pages/auth/forgot-password"
import DashboardPage from "./pages/dashboard"
import CataloguePage from "./pages/catalogue"
import ResourceDetailPage from "./pages/resource-detail"
import MyResourcesPage from "./pages/my-resources"
import BorrowingPage from "./pages/borrowing"
import CartPage from "./pages/cart"
import MessagesPage from "./pages/messages"
import ProfilePage from "./pages/profile"
import NotificationsPage from "./pages/notifications"
import SettingsPage from "./pages/settings"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth routes */}
      <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      
      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/resource/:id" element={<ResourceDetailPage />} />
        <Route path="/my-resources" element={<MyResourcesPage />} />
        <Route path="/borrowing" element={<BorrowingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
