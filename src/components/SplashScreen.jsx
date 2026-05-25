import { motion } from 'framer-motion'
import ritaLogo from '../assets/rita_logo.jpeg'

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0,
        background: '#0f0e1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      >
        <img src={ritaLogo} alt="Rita Light"
          style={{
            width: 100, height: 100,
            borderRadius: '50%', objectFit: 'cover',
            border: '3px solid #fbbf24',
            boxShadow: '0 0 40px rgba(251,191,36,0.4)',
          }}
        />
      </motion.div>

      {/* Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: 'center', marginTop: 24 }}
      >
        <div style={{
          fontSize: 22, fontWeight: 900,
          color: '#f1f0ff', letterSpacing: '0.06em',
        }}>RITA LIGHT</div>
        <div style={{
          fontSize: 11, color: '#fbbf24',
          fontWeight: 700, letterSpacing: '0.2em',
          marginTop: 4,
        }}>WEALTH CIRCLE™</div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          fontSize: 13, color: '#534AB7',
          marginTop: 12, fontStyle: 'italic',
        }}
      >Save Together. Rise Together.</motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ display: 'flex', gap: 8, marginTop: 48 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#fbbf24',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}