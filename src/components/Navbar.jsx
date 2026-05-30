import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

const userLinks = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/groups',    icon: '👥', label: 'Groups' },
  { to: '/history',   icon: '💰', label: 'Pay' },
  { to: '/history',   icon: '📋', label: 'History' },
  { to: '/profile',   icon: '👤', label: 'Profile' },
]

const adminLinks = [
  { to: '/admin',           icon: '📊', label: 'Overview' },
  { to: '/admin/members',   icon: '👥', label: 'Members'  },
  { to: '/admin/payments',  icon: '💰', label: 'Payments' },
  { to: '/admin/groups',    icon: '⭕', label: 'Circles'  },
]

export default function Navbar() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const links = profile?.is_admin ? adminLinks : userLinks

  // Hide navbar on auth pages
  const hideOn = ['/', '/login', '/register']
  const isAdminPage = location.pathname.startsWith('/admin')
  if (hideOn.includes(location.pathname) || isAdminPage) return null

  return (
    <nav
      className="navbar-safe"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1830',
        borderTop: '1px solid #3C3489',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 0 14px',
        zIndex: 100,
      }}
    >
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          style={{ textDecoration: 'none', flex: 1 }}
        >
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.88 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    top: -10,
                    width: 32,
                    height: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #7F77DD, #fbbf24)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              )}

              {/* Icon */}
              <div style={{
                fontSize: 20,
                filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)',
                transition: 'filter 0.2s ease',
              }}>
                {link.icon}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#7F77DD' : '#534AB7',
                transition: 'color 0.2s ease',
              }}>
                {link.label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}