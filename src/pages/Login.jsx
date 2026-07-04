import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { loginOneSignalUser } from '../lib/oneSignal'
import toast from 'react-hot-toast'
import ritaLogo from '../assets/rita_logo.jpeg'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading]       = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [resetEmail, setResetEmail] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ── Login
  const handleLogin = async () => {
    if (!form.email.trim())    { toast.error('Enter your email');    return }
    if (!form.password.trim()) { toast.error('Enter your password'); return }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (error) throw error

      // Check if blacklisted
      const { data: profile } = await supabase
        .from('users')
        .select('is_blacklisted, is_admin, full_name')
        .eq('id', data.user.id)
        .single()

      if (profile?.is_blacklisted) {
        await supabase.auth.signOut()
        toast.error('Your account has been suspended. Contact support.')
        return
      }

    // Block admin from using normal login page
    if (profile?.is_admin) {
    await supabase.auth.signOut()
    toast.error('Please use the admin login page')
    navigate('/admin/login')
    return
    }

    loginOneSignalUser(user.id)
    
    toast.success(`Welcome back, ${profile?.full_name?.split(' ')[0]} 👋`)
    navigate('/dashboard')

    } catch (err) {
      if (err.message?.includes('Invalid login')) {
        toast.error('Wrong email or password. Try again.')
      } else {
        toast.error(err.message || 'Login failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { toast.error('Enter your email address'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (error) throw error
      toast.success('Password reset link sent to your email!')
      setForgotMode(false)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  // ── Enter key support
  const onKeyDown = (e) => {
    if (e.key === 'Enter') forgotMode ? handleForgotPassword() : handleLogin()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0e1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glow blobs */}
      <div style={{ position:'absolute', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity:0, y:-20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
          style={{ textAlign:'center', marginBottom:32 }}
        >
          <img src={ritaLogo} alt="logo"
            style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid #fbbf24', cursor:'pointer', marginBottom:10 }}
            onClick={() => navigate('/')}
          />
          <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff', letterSpacing:'0.04em' }}>RITA LIGHT</div>
          <div style={{ fontSize:9, color:'#fbbf24', fontWeight:700, letterSpacing:'0.2em' }}>WEALTH CIRCLE™</div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, delay:0.1 }}
          style={{
            background:'#1a1830', border:'1px solid #2a2840',
            borderRadius:24, padding:'32px 28px',
          }}
        >
          {!forgotMode ? (
            <>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#f1f0ff', marginBottom:6 }}>
                Welcome back 👋
              </h2>
              <p style={{ fontSize:13, color:'#AFA9EC', marginBottom:28, lineHeight:1.6 }}>
                Login to your Rita Light Wealth Circle account
              </p>

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ paddingRight:44 }}
                  />
                  <button
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position:'absolute', right:14, top:'50%',
                      transform:'translateY(-50%)',
                      background:'none', border:'none',
                      color:'#534AB7', cursor:'pointer', fontSize:16,
                      padding:0,
                    }}
                  >{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign:'right', marginBottom:24 }}>
                <button
                  onClick={() => setForgotMode(true)}
                  style={{
                    background:'none', border:'none',
                    color:'#7F77DD', fontSize:12,
                    cursor:'pointer', fontWeight:500,
                  }}
                >Forgot password?</button>
              </div>

              {/* Login button */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width:'100%', padding:'14px',
                  background: loading
                    ? '#2a2840'
                    : 'linear-gradient(135deg, #7F77DD, #534AB7)',
                  border:'none', color: loading ? '#534AB7' : '#fff',
                  borderRadius:14, fontSize:15,
                  fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom:16,
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(127,119,221,0.3)',
                  transition:'all 0.2s',
                }}
              >
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <motion.span
                      animate={{ rotate:360 }}
                      transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                      style={{ display:'inline-block', width:16, height:16, border:'2px solid #534AB7', borderTop:'2px solid #7F77DD', borderRadius:'50%' }}
                    />
                    Logging in...
                  </span>
                ) : 'Login to my account →'}
              </motion.button>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ flex:1, height:1, background:'#2a2840' }} />
                <span style={{ fontSize:11, color:'#3C3489' }}>OR</span>
                <div style={{ flex:1, height:1, background:'#2a2840' }} />
              </div>

              {/* Register link */}
              <div style={{ textAlign:'center' }}>
                <span style={{ fontSize:13, color:'#534AB7' }}>Don't have an account? </span>
                <Link to="/register" style={{ color:'#fbbf24', fontWeight:700, textDecoration:'none', fontSize:13 }}>
                  Join a Circle ✦
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* ── Forgot Password Mode */}
              <motion.div
                initial={{ opacity:0, x:20 }}
                animate={{ opacity:1, x:0 }}
                transition={{ duration:0.3 }}
              >
                <button
                  onClick={() => setForgotMode(false)}
                  style={{
                    background:'none', border:'none',
                    color:'#7F77DD', fontSize:13,
                    cursor:'pointer', marginBottom:20,
                    display:'flex', alignItems:'center', gap:6,
                    padding:0,
                  }}
                >← Back to login</button>

                <h2 style={{ fontSize:22, fontWeight:800, color:'#f1f0ff', marginBottom:6 }}>
                  Reset password 🔑
                </h2>
                <p style={{ fontSize:13, color:'#AFA9EC', marginBottom:28, lineHeight:1.6 }}>
                  Enter the email address you registered with. We'll send you a reset link.
                </p>

                <div style={{ marginBottom:24 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') handleForgotPassword() }}
                    placeholder="your@email.com"
                  />
                </div>

                <motion.button
                  whileTap={{ scale:0.97 }}
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                    width:'100%', padding:'14px',
                    background: loading ? '#2a2840' : 'linear-gradient(135deg, #7F77DD, #534AB7)',
                    border:'none', color: loading ? '#534AB7' : '#fff',
                    borderRadius:14, fontSize:15,
                    fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </motion.button>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.4 }}
          style={{ textAlign:'center', marginTop:24 }}
        >
          <p style={{ fontSize:11, color:'#2a2840', lineHeight:1.7 }}>
            By logging in you agree to our Terms & Conditions.<br />
            Rita Light Wealth Circle™ — Save Together. Rise Together.
          </p>
        </motion.div>

      </div>
    </div>
  )
}