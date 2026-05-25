import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'

import Landing        from './pages/Landing'
import Register       from './pages/Register'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Groups         from './pages/Groups'
import SlotPicker     from './pages/SlotPicker'
import Payment        from './pages/Payment'
import History        from './pages/History'
import Profile        from './pages/Profile'
import Settings       from './pages/Settings'
import Notifications  from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminGroups    from './pages/admin/AdminGroups'
import AdminPayments  from './pages/admin/AdminPayments'
import AdminMembers   from './pages/admin/AdminMembers'
import AdminLogin     from './pages/admin/AdminLogin'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar         from './components/Navbar'
import SplashScreen   from './components/SplashScreen'

// Detect if app is installed as PWA
const isPWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function App() {
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(isPWA())
  useAuth()
  useTheme()

  useEffect(() => {
    if (!isPWA()) return
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Splash screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {/* App routes */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* Public */}
          <Route path="/" element={
            isPWA()
              ? <Navigate to="/login" replace />
              : <Landing />
          }/>
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* User pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/groups" element={
            <ProtectedRoute><Groups /></ProtectedRoute>
          }/>
          <Route path="/slots/:groupId" element={
            <ProtectedRoute><SlotPicker /></ProtectedRoute>
          }/>
          <Route path="/payment/:groupId" element={
            <ProtectedRoute><Payment /></ProtectedRoute>
          }/>
          <Route path="/history" element={
            <ProtectedRoute><History /></ProtectedRoute>
          }/>
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          }/>
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          }/>
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          }/>

          {/* Admin pages */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          }/>
          <Route path="/admin/groups" element={
            <ProtectedRoute adminOnly><AdminGroups /></ProtectedRoute>
          }/>
          <Route path="/admin/payments" element={
            <ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>
          }/>
          <Route path="/admin/members" element={
            <ProtectedRoute adminOnly><AdminMembers /></ProtectedRoute>
          }/>

        </Routes>
      </AnimatePresence>

      <Navbar />
    </>
  )
}