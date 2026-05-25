import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import ritaLogo from '../../assets/rita_logo.jpeg'

export default function AdminLogin() {
  const navigate    = useNavigate()
  const { setUser, fetchProfile } = useAuthStore()

  const [form, setForm]       = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked]     = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogin = async () => {
    if (locked) {
      toast.error('Too many failed attempts. Try again later.')
      return
    }
    if (!form.email.trim())    { toast.error('Enter email');    return }
    if (!form.password.trim()) { toast.error('Enter password'); return }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (error) throw error

      // Fetch profile to check is_admin
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // Not an admin — sign them out immediately
      if (!profile?.is_admin) {
        await supabase.auth.signOut()
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= 3) {
          setLocked(true)
          setTimeout(() => { setLocked(false); setAttempts(0) }, 5 * 60 * 1000)
          toast.error('Too many failed attempts. Locked for 5 minutes.')
        } else {
          toast.error(`Access denied. This is a restricted area. (${3 - newAttempts} attempts left)`)
        }
        return
      }

      // Blacklisted check
      if (profile?.is_blacklisted) {
        await supabase.auth.signOut()
        toast.error('Account suspended.')
        return
      }

      setUser(data.user)
      await fetchProfile(data.user.id)
      toast.success(`Welcome back, ${profile.full_name?.split(' ')[0]} 👑`)
      navigate('/admin')

    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 3) {
        setLocked(true)
        setTimeout(() => { setLocked(false); setAttempts(0) }, 5 * 60 * 1000)
        toast.error('Too many failed attempts. Locked for 5 minutes.')
      } else {
        toast.error(`Wrong credentials. (${3 - newAttempts} attempts left)`)
      }
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'#080710',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'24px 20px',
      position:'relative', overflow:'hidden',
      fontFamily:'Inter, sans-serif',
    }}>

      {/* Background effects */}
      <div style={{ position:'absolute', top:-150, left:-150, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-150, right:-150, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* Gold top line */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, height:3,
        background:'linear-gradient(90deg, transparent, #fbbf24, #d97706, #fbbf24, transparent)',
      }} />

      <div style={{ width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity:0, y:-20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
          style={{ textAlign:'center', marginBottom:32 }}
        >
          <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
            <img src={ritaLogo} alt="logo"
              style={{
                width:72, height:72, borderRadius:'50%',
                objectFit:'cover',
                border:'2px solid #fbbf24',
                boxShadow:'0 0 32px rgba(251,191,36,0.3)',
              }}
            />
            {/* Crown badge */}
            <div style={{
              position:'absolute', bottom:-4, right:-4,
              width:24, height:24, borderRadius:'50%',
              background:'linear-gradient(135deg, #fbbf24, #d97706)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, border:'2px solid #080710',
            }}>👑</div>
          </div>
          <div style={{ fontSize:15, fontWeight:900, color:'#f1f0ff', letterSpacing:'0.06em' }}>
            RITA LIGHT
          </div>
          <div style={{ fontSize:9, color:'#fbbf24', fontWeight:700, letterSpacing:'0.25em', marginTop:2 }}>
            ADMIN CONTROL PANEL
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, delay:0.1 }}
          style={{
            background:'#0f0e1a',
            border:'1px solid #fbbf2430',
            borderRadius:24,
            padding:'32px 28px',
            position:'relative', overflow:'hidden',
          }}
        >
          {/* Gold corner accent */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg, transparent, #fbbf24, transparent)',
          }} />

          <h2 style={{ fontSize:20, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>
            Admin Access Only
          </h2>
          <p style={{ fontSize:12, color:'#534AB7', marginBottom:28, lineHeight:1.6 }}>
            🔒 This area is restricted to authorized personnel only.
            Unauthorized access attempts are logged.
          </p>

          {/* Locked state */}
          {locked && (
            <motion.div
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              style={{
                background:'#2d0a0a', border:'1px solid #7f1d1d',
                borderRadius:12, padding:'12px 14px',
                marginBottom:20,
                display:'flex', alignItems:'center', gap:10,
              }}
            >
              <span style={{ fontSize:20 }}>🔒</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#ef4444' }}>Access Locked</div>
                <div style={{ fontSize:11, color:'#fca5a5', marginTop:1 }}>
                  Too many failed attempts. Locked for 5 minutes.
                </div>
              </div>
            </motion.div>
          )}

          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>
              Admin Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="admin@ritalight.ng"
              disabled={locked}
              style={{
                background:'#13121f',
                border:'1px solid #fbbf2430',
                color:'#f1f0ff',
                borderRadius:12, padding:'13px 16px',
                width:'100%', fontSize:14,
                outline:'none', transition:'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='#fbbf24'}
              onBlur={e => e.target.style.borderColor='#fbbf2430'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>
              Password
            </label>
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Enter admin password"
                disabled={locked}
                style={{
                  background:'#13121f',
                  border:'1px solid #fbbf2430',
                  color:'#f1f0ff',
                  borderRadius:12, padding:'13px 44px 13px 16px',
                  width:'100%', fontSize:14,
                  outline:'none', transition:'border 0.2s',
                }}
                onFocus={e => e.target.style.borderColor='#fbbf24'}
                onBlur={e => e.target.style.borderColor='#fbbf2430'}
              />
              <button onClick={() => setShowPass(p => !p)}
                style={{
                  position:'absolute', right:14, top:'50%',
                  transform:'translateY(-50%)',
                  background:'none', border:'none',
                  color:'#534AB7', cursor:'pointer', fontSize:16, padding:0,
                }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* Attempts warning */}
          {attempts > 0 && !locked && (
            <div style={{
              background:'#1c1a0e', border:'1px solid #854d0e',
              borderRadius:10, padding:'8px 12px',
              fontSize:11, color:'#fbbf24',
              marginBottom:16,
              display:'flex', alignItems:'center', gap:6,
            }}>
              ⚠️ {attempts} failed attempt{attempts > 1 ? 's' : ''}. {3 - attempts} remaining before lockout.
            </div>
          )}

          {/* Login button */}
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={handleLogin}
            disabled={loading || locked}
            style={{
              width:'100%', padding:'14px',
              background: locked
                ? '#1f1d35'
                : loading
                ? '#2a1f00'
                : 'linear-gradient(135deg, #fbbf24, #d97706)',
              border:'none',
              color: locked ? '#534AB7' : '#3a1f00',
              borderRadius:14, fontSize:15,
              fontWeight:800,
              cursor: locked || loading ? 'not-allowed' : 'pointer',
              boxShadow: !locked && !loading ? '0 6px 24px rgba(251,191,36,0.25)' : 'none',
              transition:'all 0.2s',
            }}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <motion.span
                  animate={{ rotate:360 }}
                  transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                  style={{ display:'inline-block', width:16, height:16, border:'2px solid #d9770660', borderTop:'2px solid #d97706', borderRadius:'50%' }}
                />
                Verifying...
              </span>
            ) : locked ? '🔒 Locked' : 'Enter Admin Panel 👑'}
          </motion.button>

        </motion.div>

        {/* Back to main site */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.4 }}
          style={{ textAlign:'center', marginTop:20 }}
        >
          <button onClick={() => navigate('/')}
            style={{
              background:'none', border:'none',
              color:'#3C3489', fontSize:12,
              cursor:'pointer', fontWeight:500,
            }}>← Back to main site</button>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.5 }}
          style={{ textAlign:'center', marginTop:16 }}
        >
          <p style={{ fontSize:10, color:'#2a2840', lineHeight:1.6 }}>
            🔐 All admin access attempts are monitored and logged.<br />
            Unauthorized access is strictly prohibited.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
