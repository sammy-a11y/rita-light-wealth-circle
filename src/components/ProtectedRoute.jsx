import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuthStore()

  // Still checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: '#0f0e1a' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid #3C3489',
          borderTop: '3px solid #7F77DD',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          color: '#AFA9EC',
          fontSize: 14,
          marginTop: 16
        }}>Loading...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Not logged in
    if (!user) {
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />
    }

  // Trying to access admin page but not admin
  if (adminOnly && !profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  // Not verified yet
//   if (!profile?.is_verified && !adminOnly) {
//     return <Navigate to="/register?step=pending" replace />
//   }

  // Blacklisted
  if (profile?.is_blacklisted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#0f0e1a' }}>
        <div style={{
          background: '#1f1d35',
          border: '1px solid #991b1b',
          borderRadius: 20,
          padding: 32,
          textAlign: 'center',
          maxWidth: 340
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>🚫</div>
          <h2 style={{
            color: '#f87171',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8
          }}>Account Suspended</h2>
          <p style={{
            color: '#AFA9EC',
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: 16
          }}>
            Your account has been blacklisted from Rita Light Wealth Circle.
          </p>
          {profile?.blacklist_reason && (
            <div style={{
              background: '#fee2e2',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              color: '#991b1b'
            }}>
              Reason: {profile.blacklist_reason}
            </div>
          )}
        </div>
      </div>
    )
  }

  return children
}