import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function SlotPicker() {
  const { groupId } = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [group, setGroup]         = useState(null)
  const [slots, setSlots]         = useState([])
  const [selected, setSelected]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [maxSlots, setMaxSlots]   = useState(1)

  useEffect(() => {
    fetchGroupAndSlots()
    fetchApprovedRequest()
  }, [groupId])

  // ── Fetch group info and all slots
  const fetchGroupAndSlots = async () => {
    setLoading(true)
    try {
      // Get group
      const { data: grp } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()
      setGroup(grp)

      // Get all slots for this group
      const { data: slotData } = await supabase
        .from('slots')
        .select('*, users(full_name)')
        .eq('group_id', groupId)
        .order('slot_number', { ascending: true })
      setSlots(slotData || [])
    } catch {
      toast.error('Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  // ── Get how many slots user was approved for
  const fetchApprovedRequest = async () => {
    const { data } = await supabase
      .from('group_requests')
      .select('slots_wanted')
      .eq('user_id', profile?.id)
      .eq('group_id', groupId)
      .eq('status', 'approved')
      .single()
    if (data) setMaxSlots(data.slots_wanted)
  }

  // ── Get slot status
  const getSlotStatus = (slot) => {
    if (slot.slot_number === 1 || slot.slot_number === 2) return 'taken'
    if (slot.user_id === profile?.id) return 'mine'
    if (slot.user_id !== null) return 'taken'
    return 'available'
  }

  // ── Toggle slot selection
  const toggleSlot = (slot) => {
    const status = getSlotStatus(slot)
    if (status === 'taken') {
      toast.error('This slot is already taken')
      return
    }
    if (status === 'mine') {
      toast('You already own this slot')
      return
    }
    const alreadySelected = selected.includes(slot.slot_number)
    if (!alreadySelected && selected.length >= maxSlots) {
      toast.error(`You can only pick ${maxSlots} slot${maxSlots > 1 ? 's' : ''}`)
      return
    }
    setSelected(prev =>
      alreadySelected
        ? prev.filter(n => n !== slot.slot_number)
        : [...prev, slot.slot_number]
    )
  }

  // ── Confirm slot selection
  const confirmSlots = async () => {
    if (selected.length === 0) {
      toast.error('Please pick at least one slot')
      return
    }
    if (selected.length !== maxSlots) {
      toast.error(`Please pick exactly ${maxSlots} slot${maxSlots > 1 ? 's' : ''}`)
      return
    }
    setSaving(true)
    try {
      // Insert selected slots
      const inserts = selected.map(num => ({
        group_id:    groupId,
        slot_number: num,
        user_id:     profile.id,
        status:      'unpaid',
      }))

      const { error } = await supabase
        .from('slots')
        .upsert(inserts, { onConflict: 'group_id,slot_number' })
      if (error) throw error

      // Send notification
      await supabase.from('notifications').insert({
        user_id:  profile.id,
        group_id: groupId,
        title:    'Slots Confirmed! 🎯',
        message:  `You have successfully picked slot${selected.length > 1 ? 's' : ''} #${selected.join(' and #')} in ${group?.name}. Make your first payment to activate.`,
        type:     'success',
      })

      toast.success(`Slot${selected.length > 1 ? 's' : ''} #${selected.join(' & #')} confirmed! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to confirm slots')
    } finally {
      setSaving(false)
    }
  }

  const slotColor = (slot) => {
    const status = getSlotStatus(slot)
    const isSelected = selected.includes(slot.slot_number)
    if (isSelected)    return { bg:'linear-gradient(135deg, #7F77DD, #534AB7)', border:'none',        text:'#fff',     cursor:'pointer'     }
    if (status==='taken') return { bg:'#1f1d35',                                  border:'1px solid #2a2840', text:'#3C3489',  cursor:'not-allowed' }
    if (status==='mine')  return { bg:'linear-gradient(135deg, #052e16, #166534)', border:'1px solid #166534', text:'#22c55e', cursor:'default'     }
    return                       { bg:'#1a1830',                                  border:'1px solid #2a2840', text:'#AFA9EC',  cursor:'pointer'     }
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
          style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #7F77DD', borderRadius:'50%' }} />
      </div>
    )
  }

  const availableCount = slots.filter(s => getSlotStatus(s) === 'available').length

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:90 }}>

      {/* ── HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #1a1830, #1f1d35)',
        borderBottom:'1px solid #2a2840',
        padding:'20px 20px 16px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <button onClick={() => navigate(-1)}
            style={{ background:'none', border:'none', color:'#7F77DD', fontSize:13, cursor:'pointer', marginBottom:8, padding:0, display:'flex', alignItems:'center', gap:6 }}>
            ← Back
          </button>
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Pick Your Slot</div>
          <div style={{ fontSize:13, color:'#534AB7', marginTop:2 }}>{group?.name}</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── GROUP INFO */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{
            background:'linear-gradient(135deg, #1a1830, #1f1d35)',
            border:'1px solid #2a2840',
            borderRadius:18, padding:16, marginBottom:20,
            display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8,
          }}
        >
          {[
            { label:'PACK',     value:`₦${group?.amount_per_slot?.toLocaleString()}`, sub: group?.frequency === 'weekly' ? '/week' : '/month', color:'#f1f0ff' },
            { label:'COLLECT',  value:`₦${group?.payout_amount?.toLocaleString()}`,   sub:'per slot',  color:'#fbbf24' },
            { label:'AVAILABLE',value:availableCount,                                  sub:'slots open', color:'#22c55e' },
          ].map(info => (
            <div key={info.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, letterSpacing:'0.08em', marginBottom:4 }}>{info.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:info.color }}>{info.value}</div>
              <div style={{ fontSize:9, color:'#534AB7' }}>{info.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* ── LEGEND */}
        <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { color:'#7F77DD', label:'Selected by you' },
            { color:'#22c55e', label:'Your slot'       },
            { color:'#3C3489', label:'Taken'           },
            { color:'#AFA9EC', label:'Available'       },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:l.color }} />
              <span style={{ fontSize:11, color:'#534AB7' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* ── SLOT GRID */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(5, 1fr)',
          gap:8, marginBottom:20,
        }}>
          {slots.map((slot, i) => {
            const colors     = slotColor(slot)
            const isSelected = selected.includes(slot.slot_number)
            return (
              <motion.button
                key={slot.id}
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay:i * 0.02, type:'spring', stiffness:300 }}
                whileTap={{ scale: getSlotStatus(slot) === 'available' || isSelected ? 0.88 : 1 }}
                whileHover={{ scale: getSlotStatus(slot) === 'available' ? 1.08 : 1 }}
                onClick={() => toggleSlot(slot)}
                style={{
                  height:52, borderRadius:12,
                  background:colors.bg,
                  border:colors.border,
                  color:colors.text,
                  fontSize:13, fontWeight:700,
                  cursor:colors.cursor,
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  gap:2,
                  boxShadow: isSelected ? '0 0 12px rgba(127,119,221,0.5)' : 'none',
                  transition:'box-shadow 0.2s',
                }}
              >
                <span>#{slot.slot_number}</span>
                {getSlotStatus(slot) === 'taken' && (
                  <span style={{ fontSize:8, color:'#3C3489', fontWeight:600 }}>TAKEN</span>
                )}
                {getSlotStatus(slot) === 'mine' && (
                  <span style={{ fontSize:8, color:'#22c55e', fontWeight:600 }}>MINE</span>
                )}
                {isSelected && (
                  <span style={{ fontSize:8, color:'#fff', fontWeight:600 }}>✓</span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* ── SELECTION SUMMARY */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:10 }}
              style={{
                background:'linear-gradient(135deg, #1e1b4b, #1f1d35)',
                border:'1px solid #4338ca40',
                borderRadius:16, padding:16,
                marginBottom:16,
              }}
            >
              <div style={{ fontSize:13, fontWeight:700, color:'#f1f0ff', marginBottom:10 }}>
                Your Selection
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                {selected.map(num => (
                  <div key={num} style={{
                    background:'linear-gradient(135deg, #7F77DD, #534AB7)',
                    borderRadius:8, padding:'4px 12px',
                    fontSize:13, fontWeight:700, color:'#fff',
                  }}>Slot #{num}</div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:10, color:'#534AB7', fontWeight:600 }}>YOU PACK</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff' }}>
                    ₦{(group?.amount_per_slot * selected.length)?.toLocaleString()}
                    <span style={{ fontSize:10, color:'#534AB7', fontWeight:400 }}>/{group?.frequency === 'weekly' ? 'week' : 'month'}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'#534AB7', fontWeight:600 }}>YOU COLLECT</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#fbbf24' }}>
                    ₦{(group?.payout_amount * selected.length)?.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INSTRUCTION */}
        <div style={{
          background:'#1a1830', border:'1px solid #2a2840',
          borderRadius:12, padding:14, marginBottom:20,
          fontSize:12, color:'#534AB7', lineHeight:1.7,
        }}>
          {selected.length === 0
            ? `👆 Tap to select ${maxSlots} slot${maxSlots > 1 ? 's' : ''}. Slots 1 and 2 are taken.`
            : selected.length < maxSlots
            ? `👆 Select ${maxSlots - selected.length} more slot${maxSlots - selected.length > 1 ? 's' : ''}`
            : `✅ You have selected ${selected.length} slot${selected.length > 1 ? 's' : ''}. Tap confirm to lock them in.`
          }
        </div>

        {/* ── CONFIRM BUTTON */}
        <motion.button
          whileTap={{ scale:0.97 }}
          onClick={confirmSlots}
          disabled={saving || selected.length !== maxSlots}
          style={{
            width:'100%', padding:'15px',
            background: selected.length === maxSlots
              ? 'linear-gradient(135deg, #fbbf24, #d97706)'
              : '#1f1d35',
            border: selected.length === maxSlots ? 'none' : '1px solid #2a2840',
            color: selected.length === maxSlots ? '#3a1f00' : '#534AB7',
            borderRadius:14, fontSize:15,
            fontWeight:800,
            cursor: selected.length === maxSlots ? 'pointer' : 'not-allowed',
            boxShadow: selected.length === maxSlots ? '0 6px 20px rgba(251,191,36,0.3)' : 'none',
            transition:'all 0.3s',
          }}
        >
          {saving
            ? 'Confirming...'
            : selected.length === maxSlots
            ? `Confirm Slot${selected.length > 1 ? 's' : ''} ✦`
            : `Pick ${maxSlots} Slot${maxSlots > 1 ? 's' : ''} to Continue`
          }
        </motion.button>

      </div>
    </div>
  )
}
