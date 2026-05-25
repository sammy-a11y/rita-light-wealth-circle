import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

function Avatar({ name, size = 72, fontSize = 26 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'
  const colors = [
    ['#7F77DD','#534AB7'],['#f59e0b','#d97706'],
    ['#10b981','#059669'],['#8b5cf6','#7c3aed'],
  ]
  const [from, to] = colors[name ? name.charCodeAt(0) % colors.length : 0]
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, ${from}, ${to})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize, fontWeight:800, color:'#fff',
      boxShadow:`0 8px 24px ${from}40`,
    }}>{initials}</div>
  )
}

export default function Profile() {
  const navigate    = useNavigate()
  const { profile, logout } = useAuthStore()
  const { t }       = useTheme()

  const [groups, setGroups]     = useState([])
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({
    full_name: '', phone: '', city: '', state: '',
  })

  const NIGERIAN_STATES = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
    'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu',
    'FCT - Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
    'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo',
    'Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
  ]

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone:     profile.phone     || '',
        city:      profile.city      || '',
        state:     profile.state     || '',
      })
      fetchMyGroups()
    }
  }, [profile])

  const fetchMyGroups = async () => {
    const { data } = await supabase
      .from('slots')
      .select('groups(id, name, status, amount_per_slot, frequency)')
      .eq('user_id', profile?.id)
    if (data) {
      const unique = []
      const seen   = new Set()
      data.forEach(s => {
        if (s.groups && !seen.has(s.groups.id)) {
          seen.add(s.groups.id)
          unique.push(s.groups)
        }
      })
      setGroups(unique)
    }
  }

  const saveProfile = async () => {
    if (!form.full_name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name.trim(),
          phone:     form.phone.trim(),
          city:      form.city.trim(),
          state:     form.state,
        })
        .eq('id', profile.id)
      if (error) throw error
      toast.success('Profile updated ✅')
      setEditing(false)
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    toast.success('Logged out successfully')
  }

  // Mask NIN
  const maskNIN = (nin) => {
    if (!nin || nin.length < 4) return '***********'
    return nin.slice(0, 3) + '*****' + nin.slice(-3)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const infoRow = (label, value, masked = false) => (
    <div key={label} style={{
      display:'flex', justifyContent:'space-between',
      alignItems:'center', padding:'12px 0',
      borderBottom:`1px solid ${t.border}`,
    }}>
      <span style={{ fontSize:12, color:t.textMuted, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:13, color: masked ? t.textMuted : t.text, fontWeight:500, fontFamily: masked ? 'monospace' : 'inherit' }}>
        {value || '—'}
      </span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:t.bg, paddingBottom:90, transition:'background 0.3s' }}>

      {/* ── HEADER */}
      <div style={{
        background:t.headerBg,
        borderBottom:`1px solid ${t.border}`,
        padding:'20px 20px 16px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:480, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:20, fontWeight:800, color:t.text }}>My Profile</div>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background:t.bgCardAlt, border:`1px solid ${t.border}`,
              borderRadius:10, padding:'7px 14px',
              fontSize:12, color:t.textSub,
              fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}
          >⚙️ Settings</button>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 20px 0' }}>

        {/* ── AVATAR & NAME */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{
            background:t.bgCard, border:`1px solid ${t.border}`,
            borderRadius:24, padding:'28px 20px',
            textAlign:'center', marginBottom:16,
            position:'relative',
          }}
        >
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <Avatar name={profile?.full_name} size={80} fontSize={28} />
          </div>

          <div style={{ fontSize:20, fontWeight:800, color:t.text, marginBottom:4 }}>
            {profile?.full_name}
          </div>
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:12 }}>
            {profile?.email}
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <span style={{
              background:t.bgCardAlt, border:`1px solid ${t.border}`,
              borderRadius:20, padding:'4px 12px',
              fontSize:11, color:t.textSub, fontWeight:600,
            }}>
              📅 Member since {dayjs(profile?.created_at).format('MMM YYYY')}
            </span>
            <span style={{
              background: profile?.is_admin ? '#1e1b4b' : t.greenBg,
              border:`1px solid ${profile?.is_admin ? '#4338ca' : t.greenBorder}`,
              borderRadius:20, padding:'4px 12px',
              fontSize:11,
              color: profile?.is_admin ? '#818cf8' : t.green,
              fontWeight:600,
            }}>
              {profile?.is_admin ? '👑 Admin' : '✅ Verified Member'}
            </span>
          </div>
        </motion.div>

        {/* ── PERSONAL INFO */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{
            background:t.bgCard, border:`1px solid ${t.border}`,
            borderRadius:20, padding:'16px 20px', marginBottom:16,
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontSize:13, fontWeight:800, color:t.text }}>Personal Information</div>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                style={{
                  background:t.bgCardAlt, border:`1px solid ${t.border}`,
                  borderRadius:8, padding:'5px 12px',
                  fontSize:11, color:t.brand,
                  fontWeight:600, cursor:'pointer',
                }}>✏️ Edit</button>
            ) : (
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setEditing(false)}
                  style={{ background:'none', border:'none', color:t.textMuted, fontSize:11, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving}
                  style={{
                    background:`linear-gradient(135deg, ${t.brand}, ${t.brandDark})`,
                    border:'none', color:'#fff',
                    borderRadius:8, padding:'5px 12px',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                  }}>
                  {saving ? 'Saving...' : 'Save ✓'}
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div>
              {infoRow('Full Name',   profile?.full_name)}
              {infoRow('Phone',       profile?.phone)}
              {infoRow('Email',       profile?.email)}
              {infoRow('State',       profile?.state)}
              {infoRow('City',        profile?.city)}
              {infoRow('Address',     profile?.address)}
              {infoRow('Gender',      profile?.gender)}
              {infoRow('Birth Year',  profile?.birth_year?.toString())}
              {infoRow('NIN',         maskNIN(profile?.nin), true)}
              {infoRow('Occupation',  profile?.occupation)}
              {infoRow('Employment',  profile?.employment_status)}
              {infoRow('Income Range',profile?.income_range)}
            </div>
          ) : (
            <div style={{ marginTop:12 }}>
              {[
                { label:'Full name',   key:'full_name', type:'text',  placeholder:'Your full name' },
                { label:'Phone',       key:'phone',     type:'tel',   placeholder:'+234 800 000 0000' },
                { label:'City / Area', key:'city',      type:'text',  placeholder:'e.g. Ikoyi' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:t.textMuted, marginBottom:5 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:t.textMuted, marginBottom:5 }}>State</label>
                <select value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{
                background:t.bgCardAlt, border:`1px solid ${t.border}`,
                borderRadius:10, padding:10,
                fontSize:11, color:t.textMuted, lineHeight:1.6,
              }}>
                🔒 NIN, email and face video cannot be changed. Contact admin for help.
              </div>
            </div>
          )}
        </motion.div>

        {/* ── MY CIRCLES SUMMARY */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{
            background:t.bgCard, border:`1px solid ${t.border}`,
            borderRadius:20, padding:'16px 20px', marginBottom:16,
          }}
        >
          <div style={{ fontSize:13, fontWeight:800, color:t.text, marginBottom:12 }}>
            My Circles ({groups.length})
          </div>
          {groups.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:t.textMuted, fontSize:13 }}>
              No circles joined yet
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {groups.map(g => (
                <div key={g.id} style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center',
                  background:t.bgCardAlt, border:`1px solid ${t.border}`,
                  borderRadius:12, padding:'10px 14px',
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{g.name}</div>
                    <div style={{ fontSize:11, color:t.textMuted, marginTop:2 }}>
                      ₦{g.amount_per_slot?.toLocaleString()} · {g.frequency}
                    </div>
                  </div>
                  <span style={{
                    background: g.status==='active' ? t.greenBg : t.bgCard,
                    border:`1px solid ${g.status==='active' ? t.greenBorder : t.border}`,
                    color: g.status==='active' ? t.green : t.textMuted,
                    borderRadius:20, padding:'3px 10px',
                    fontSize:10, fontWeight:700, textTransform:'uppercase',
                  }}>{g.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── LOGOUT */}
        <motion.button
          whileTap={{ scale:0.97 }}
          onClick={handleLogout}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.3 }}
          style={{
            width:'100%', padding:'14px',
            background:t.redBg, border:`1px solid ${t.redBorder}`,
            color:t.red, borderRadius:14,
            fontSize:14, fontWeight:700, cursor:'pointer',
            marginBottom:16,
          }}
        >
          🚪 Logout
        </motion.button>

      </div>
    </div>
  )
}
