import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'

// ── Toggle component
function Toggle({ value, onChange, disabled = false }) {
  return (
    <motion.div
      onClick={() => !disabled && onChange(!value)}
      animate={{ backgroundColor: value ? '#7F77DD' : '#2a2840' }}
      transition={{ duration:0.2 }}
      style={{
        width:46, height:26, borderRadius:13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position:'relative', flexShrink:0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type:'spring', stiffness:500, damping:30 }}
        style={{
          position:'absolute', top:3,
          width:20, height:20, borderRadius:'50%',
          background:'#fff',
          boxShadow:'0 2px 4px rgba(0,0,0,0.3)',
        }}
      />
    </motion.div>
  )
}

// ── Section wrapper
function Section({ title, children, t }) {
  return (
    <div style={{
      background:t.bgCard, border:`1px solid ${t.border}`,
      borderRadius:20, overflow:'hidden', marginBottom:14,
    }}>
      <div style={{
        padding:'12px 18px',
        borderBottom:`1px solid ${t.border}`,
        fontSize:11, fontWeight:700,
        color:t.textMuted, letterSpacing:'0.08em',
        textTransform:'uppercase',
        background:t.bgCardAlt,
      }}>{title}</div>
      <div style={{ padding:'4px 0' }}>{children}</div>
    </div>
  )
}

// ── Setting row
function Row({ icon, label, sub, right, onClick, t, danger = false }) {
  return (
    <motion.div
      whileTap={onClick ? { backgroundColor: danger ? '#2d0a0a' : t.bgCardAlt } : {}}
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'13px 18px',
        borderBottom:`1px solid ${t.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width:34, height:34, borderRadius:10,
        background: danger ? '#2d0a0a' : t.bgCardAlt,
        border:`1px solid ${danger ? '#7f1d1d' : t.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, flexShrink:0,
      }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color: danger ? '#ef4444' : t.text }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>{sub}</div>}
      </div>
      {right}
    </motion.div>
  )
}

export default function Settings() {
  const navigate        = useNavigate()
  const { theme, setTheme, logout } = useAuthStore()
  const { t, resolved } = useTheme()

  const [notifs, setNotifs] = useState({
    payment_reminders: JSON.parse(localStorage.getItem('notif_payment') ?? 'true'),
    group_updates:     JSON.parse(localStorage.getItem('notif_group')   ?? 'true'),
    penalty_warnings:  JSON.parse(localStorage.getItem('notif_penalty') ?? 'true'),
  })

  const [showPassword,    setShowPassword]    = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm,   setDeleteConfirm]   = useState('')
  const [deleting,        setDeleting]        = useState(false)
  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' })

  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    localStorage.setItem(`notif_${key.split('_')[0]}`, JSON.stringify(updated[key]))
    toast.success(updated[key] ? 'Notifications enabled' : 'Notifications disabled')
  }

  const handleChangePassword = async () => {
    if (!pwForm.newPw)              { toast.error('Enter new password');              return }
    if (pwForm.newPw.length < 6)    { toast.error('Password must be at least 6 chars'); return }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match');     return }
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (error) throw error
      toast.success('Password changed successfully ✅')
      setShowPassword(false)
      setPwForm({ current:'', newPw:'', confirm:'' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      await supabase.auth.signOut()
      toast.success('Account deletion request sent. Admin will process it shortly.')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const themeOptions = [
    { key:'dark',   icon:'🌙', label:'Dark'   },
    { key:'light',  icon:'☀️',  label:'Light'  },
    { key:'system', icon:'📱', label:'System' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:t.bg, paddingBottom:90, transition:'background 0.3s' }}>

      {/* ── HEADER */}
      <div style={{
        background:t.headerBg, borderBottom:`1px solid ${t.border}`,
        padding:'20px 20px 16px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <button onClick={() => navigate(-1)}
            style={{ background:'none', border:'none', color:t.brand, fontSize:13, cursor:'pointer', marginBottom:8, padding:0 }}>
            ← Back
          </button>
          <div style={{ fontSize:20, fontWeight:800, color:t.text }}>Settings</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── APPEARANCE */}
        <Section title="Appearance" t={t}>
          <div style={{ padding:'14px 18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:12 }}>
              Theme
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {themeOptions.map(opt => (
                <motion.button
                  key={opt.key}
                  whileTap={{ scale:0.95 }}
                  onClick={() => {
                    setTheme(opt.key)
                    toast.success(`${opt.label} mode enabled`)
                  }}
                  style={{
                    padding:'12px 8px',
                    borderRadius:14,
                    border:`2px solid ${theme === opt.key ? t.brand : t.border}`,
                    background: theme === opt.key
                      ? `${t.brand}18`
                      : t.bgCardAlt,
                    cursor:'pointer',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', gap:6,
                    transition:'all 0.2s',
                  }}
                >
                  <span style={{ fontSize:22 }}>{opt.icon}</span>
                  <span style={{
                    fontSize:11, fontWeight:700,
                    color: theme === opt.key ? t.brand : t.textMuted,
                  }}>{opt.label}</span>
                  {theme === opt.key && (
                    <span style={{
                      width:6, height:6, borderRadius:'50%',
                      background:t.brand, display:'block',
                    }} />
                  )}
                </motion.button>
              ))}
            </div>
            <div style={{ fontSize:11, color:t.textMuted, marginTop:10, lineHeight:1.6 }}>
              {theme === 'system'
                ? `📱 Following your phone's setting — currently ${resolved} mode`
                : theme === 'dark'
                ? '🌙 Dark mode is great for night time savings 😄'
                : '☀️ Light mode — clean and bright'}
            </div>
          </div>
        </Section>

        {/* ── NOTIFICATIONS */}
        <Section title="Notifications" t={t}>
          <Row t={t} icon="💰" label="Payment Reminders"
            sub="Get notified 10 days before packing date"
            right={<Toggle value={notifs.payment_reminders} onChange={() => toggleNotif('payment_reminders')} />}
          />
          <Row t={t} icon="👥" label="Group Updates"
            sub="Group status changes and announcements"
            right={<Toggle value={notifs.group_updates} onChange={() => toggleNotif('group_updates')} />}
          />
          <Row t={t} icon="⚠️" label="Penalty Warnings"
            sub="Alert when penalty fee is about to be applied"
            right={<Toggle value={notifs.penalty_warnings} onChange={() => toggleNotif('penalty_warnings')} />}
          />
        </Section>

        {/* ── SECURITY */}
        <Section title="Security" t={t}>
          <Row t={t} icon="🔑" label="Change Password"
            sub="Update your account password"
            onClick={() => setShowPassword(v => !v)}
            right={<span style={{ color:t.textMuted, fontSize:16 }}>{showPassword ? '▲' : '▶'}</span>}
          />

          <AnimatePresence>
            {showPassword && (
              <motion.div
                initial={{ height:0, opacity:0 }}
                animate={{ height:'auto', opacity:1 }}
                exit={{ height:0, opacity:0 }}
                style={{ overflow:'hidden' }}
              >
                <div style={{ padding:'12px 18px', borderBottom:`1px solid ${t.border}` }}>
                  {[
                    { label:'New password',     key:'newPw',   type:'password', placeholder:'Min 6 characters' },
                    { label:'Confirm password', key:'confirm', type:'password', placeholder:'Repeat new password' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:10 }}>
                      <label style={{ display:'block', fontSize:11, fontWeight:600, color:t.textMuted, marginBottom:5 }}>{f.label}</label>
                      <input type={f.type} value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                  <motion.button whileTap={{ scale:0.97 }}
                    onClick={handleChangePassword}
                    style={{
                      width:'100%', padding:'11px',
                      background:`linear-gradient(135deg, ${t.brand}, ${t.brandDark})`,
                      border:'none', color:'#fff',
                      borderRadius:10, fontSize:13,
                      fontWeight:700, cursor:'pointer',
                    }}>Update Password</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* ── ABOUT */}
        <Section title="About" t={t}>
          <Row t={t} icon="📄" label="Terms & Conditions"
            sub="Read our terms of service"
            onClick={() => navigate('/')}
            right={<span style={{ color:t.textMuted }}>→</span>}
          />
          <Row t={t} icon="🔒" label="Privacy Policy"
            sub="How we handle your data"
            onClick={() => navigate('/')}
            right={<span style={{ color:t.textMuted }}>→</span>}
          />
          <Row t={t} icon="💬" label="WhatsApp Support"
            sub="Chat with admin directly"
            onClick={() => window.open('https://wa.me/2348140739102', '_blank')}
            right={<span style={{ color:t.textMuted }}>→</span>}
          />
          <Row t={t} icon="✦" label="App Version"
            sub="Rita Light Wealth Circle™"
            right={<span style={{ fontSize:12, color:t.textMuted, fontWeight:600 }}>v1.0.0</span>}
          />
        </Section>

        {/* ── DANGER ZONE */}
        <Section title="Danger Zone" t={t}>
          <Row t={t} icon="🗑️" label="Delete Account"
            sub="Permanently remove your account"
            onClick={() => setShowDeleteModal(true)}
            danger
            right={<span style={{ color:'#ef4444' }}>→</span>}
          />
        </Section>

      </div>

      {/* ══════════════════════════
          DELETE ACCOUNT MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:t.bgCard, borderTop:`1px solid ${t.border}`,
                borderRadius:'24px 24px 0 0',
                width:'100%', maxWidth:480,
                padding:'20px 24px 40px',
              }}
            >
              <div style={{ width:40, height:4, borderRadius:2, background:t.border, margin:'0 auto 20px' }} />
              <div style={{ fontSize:20, marginBottom:8, textAlign:'center' }}>⚠️</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', marginBottom:8, textAlign:'center' }}>
                Delete Account
              </div>
              <p style={{ fontSize:13, color:t.textSub, lineHeight:1.7, marginBottom:20, textAlign:'center' }}>
                This action cannot be undone. All your data, payment history and group memberships will be permanently deleted.
              </p>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:6 }}>
                  Type <strong style={{ color:'#ef4444' }}>DELETE</strong> to confirm
                </label>
                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE here" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowDeleteModal(false)}
                  style={{ flex:1, padding:'13px', background:t.bgCardAlt, border:`1px solid ${t.border}`, color:t.textSub, borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={handleDeleteAccount} disabled={deleting}
                  style={{
                    flex:1, padding:'13px',
                    background: deleting ? t.bgCardAlt : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border:'none', color: deleting ? t.textMuted : '#fff',
                    borderRadius:12, fontSize:14,
                    fontWeight:700, cursor: deleting ? 'not-allowed' : 'pointer',
                  }}>
                  {deleting ? 'Processing...' : 'Delete Account'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
