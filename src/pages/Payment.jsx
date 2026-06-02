import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const freqShort = (f) => ({ daily:'day', weekly:'week', monthly:'month' }[f] || f)

export default function Payment() {
  const { groupId } = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [group, setGroup]           = useState(null)
  const [mySlots, setMySlots]       = useState([])
  const [payments, setPayments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [receipt, setReceipt]       = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)

  const [form, setForm] = useState({
    sender_name: '', payment_date: dayjs().format('YYYY-MM-DD'),
    transaction_ref: '', amount: '', slot_id: '', slot_ids: [],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => { fetchData() }, [groupId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: grp } = await supabase.from('groups').select('*').eq('id', groupId).single()
      setGroup(grp)
      const { data: slots } = await supabase.from('slots').select('*').eq('group_id', groupId).eq('user_id', profile?.id)
      setMySlots(slots || [])
      const { data: pays } = await supabase.from('payments').select('*').eq('group_id', groupId).eq('user_id', profile?.id).order('created_at', { ascending: false })
      setPayments(pays || [])
      if (grp) set('amount', grp.amount_per_slot?.toString())
    } catch {
      toast.error('Failed to load payment info')
    } finally {
      setLoading(false)
    }
  }

  const handleReceipt = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Receipt must be under 5MB'); return }
    setReceipt(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const submitPayment = async () => {
    if (!form.sender_name.trim())     { toast.error('Enter sender name');            return }
    if (!form.payment_date)           { toast.error('Enter payment date');           return }
    if (!form.transaction_ref.trim()) { toast.error('Enter transaction reference'); return }
    if (!form.slot_ids?.length)       { toast.error('Select at least one slot');     return }
    if (!receipt)                     { toast.error('Upload your payment receipt');  return }

    setSubmitting(true)
    try {
      let receiptUrl = null
      const fileName = `receipts/${profile.id}-${Date.now()}-${receipt.name}`
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(fileName, receipt, { contentType: receipt.type })
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('verifications').getPublicUrl(fileName)
        receiptUrl = urlData?.publicUrl
      }

      // Insert one payment record per slot
      const paymentInserts = form.slot_ids.map(slotId => ({
        user_id: profile.id, group_id: groupId,
        slot_id: slotId,
        amount: group?.amount_per_slot,
        sender_name: form.sender_name.trim(),
        payment_date: form.payment_date,
        transaction_ref: form.transaction_ref.trim(),
        receipt_url: receiptUrl,
        status: 'pending', penalty_fee: 0,
      }))

      const { error } = await supabase.from('payments').insert(paymentInserts)
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: profile.id, group_id: groupId,
        title: 'Payment Submitted ✅',
        message: `Your payment for ${form.slot_ids.length} slot(s) in ${group?.name} has been submitted. Admin will verify shortly.`,
        type: 'payment',
      })

      toast.success('Payment submitted! 🎉')
      setShowForm(false); setReceipt(null); setReceiptPreview(null)
      setForm(f => ({ ...f, sender_name:'', transaction_ref:'', slot_ids:[], amount:'' }))
      fetchData()
    } catch (err) { toast.error(err.message || 'Failed to submit payment') }
    finally       { setSubmitting(false) }
  }

  // Check if payment already made this cycle
  const hasPaidThisCycle = (slotId) => {
    return payments.some(p =>
      p.slot_id === slotId &&
      p.status === 'approved' &&
      p.cycle_number === (group?.current_cycle || 1)
    )
  }

  const statusColor = (status) => ({
    pending:  { bg:'#1c1a0e', border:'#854d0e', text:'#fbbf24', icon:'⏳' },
    approved: { bg:'#052e16', border:'#166534', text:'#22c55e', icon:'✅' },
    rejected: { bg:'#2d0a0a', border:'#7f1d1d', text:'#ef4444', icon:'❌' },
  }[status] || { bg:'#1f1d35', border:'#2a2840', text:'#AFA9EC', icon:'❓' })

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
          style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #7F77DD', borderRadius:'50%' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:90 }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg, #1a1830, #1f1d35)', borderBottom:'1px solid #2a2840', padding:'20px 20px 16px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'#7F77DD', fontSize:13, cursor:'pointer', marginBottom:8, padding:0 }}>← Back</button>
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Make Payment</div>
          <div style={{ fontSize:13, color:'#534AB7', marginTop:2 }}>{group?.name}</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* PENALTY WARNING */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="penalty-pulse"
          style={{ background:'#2d0a0a', border:'1px solid #7f1d1d', borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:10 }}
        >
          <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#ef4444', marginBottom:2 }}>Late Payment Warning</div>
            <div style={{ fontSize:12, color:'#fca5a5', lineHeight:1.6 }}>
              Missing your payment date attracts a <strong>₦1,000 penalty fee</strong> automatically added to your balance.
            </div>
          </div>
        </motion.div>

        {/* ACCOUNT DETAILS */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'linear-gradient(135deg, #1a1830, #1f1d35)', border:'1px solid #2a2840', borderRadius:18, padding:18, marginBottom:16 }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f1f0ff' }}>💳 Pay to this account</div>
            <button onClick={() => { navigator.clipboard.writeText(group?.account_number || ''); toast.success('Copied!') }}
              style={{ background:'#7F77DD20', border:'1px solid #7F77DD40', borderRadius:8, padding:'4px 10px', fontSize:11, color:'#7F77DD', fontWeight:600, cursor:'pointer' }}>
              Copy number
            </button>
          </div>

          {[
            { label:'Bank',           value: group?.bank_name     || 'Contact admin' },
            { label:'Account Name',   value: group?.account_name  || 'Contact admin' },
            { label:'Account Number', value: group?.account_number|| 'Contact admin', highlight:true },
            { label:'Amount Due',     value:`₦${group?.amount_per_slot?.toLocaleString()} per ${freqShort(group?.frequency)}`, gold:true },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom:'1px solid #2a2840', marginBottom:10 }}>
              <span style={{ fontSize:12, color:'#534AB7' }}>{row.label}</span>
              <span style={{
                fontSize: row.highlight ? 18 : 13,
                fontWeight: row.highlight || row.gold ? 800 : 600,
                color: row.gold ? '#fbbf24' : row.highlight ? '#7F77DD' : '#f1f0ff',
                letterSpacing: row.highlight ? '0.05em' : 'normal',
              }}>{row.value}</span>
            </div>
          ))}

          <div style={{ fontSize:11, color:'#534AB7', lineHeight:1.6, marginTop:4 }}>
            ℹ️ After making the transfer, drop your receipt below. Admin will verify and approve.
          </div>
        </motion.div>

        {/* MY SLOTS */}
        {mySlots.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f1f0ff', marginBottom:10 }}>My Slots in this Circle</div>
            <div style={{ display:'flex', gap:8 }}>
              {mySlots.map(slot => (
                <div key={slot.id} style={{
                  background: slot.status === 'paid' ? '#052e16' : '#1f1d35',
                  border:`1px solid ${slot.status === 'paid' ? '#166534' : '#3C3489'}`,
                  borderRadius:10, padding:'8px 14px',
                  fontSize:13, fontWeight:700,
                  color: slot.status === 'paid' ? '#22c55e' : '#AFA9EC',
                }}>#{slot.slot_number} {slot.status === 'paid' ? '✓' : ''}</div>
              ))}
            </div>
          </div>
        )}

        {/* PAY BUTTON */}
        <motion.button whileTap={{ scale:0.97 }} onClick={() => setShowForm(true)}
          style={{
            width:'100%', padding:'15px',
            background:'linear-gradient(135deg, #fbbf24, #d97706)',
            border:'none', color:'#3a1f00', borderRadius:14, fontSize:15,
            fontWeight:800, cursor:'pointer', boxShadow:'0 6px 20px rgba(251,191,36,0.3)', marginBottom:20,
          }}>I Have Paid — Drop Receipt ✦</motion.button>

        {/* PAYMENT HISTORY */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff', marginBottom:12 }}>Payment History</div>
          {payments.length === 0 ? (
            <div style={{ background:'#1a1830', border:'1px dashed #2a2840', borderRadius:16, padding:24, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
              <div style={{ fontSize:13, color:'#534AB7' }}>No payments yet</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {payments.map((pay, i) => {
                const colors = statusColor(pay.status)
                return (
                  <motion.div key={pay.id}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    style={{ background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:14, padding:'14px 16px' }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff' }}>₦{pay.amount?.toLocaleString()}</div>
                        <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                          {dayjs(pay.payment_date).format('DD MMM YYYY')} · {pay.transaction_ref}
                        </div>
                      </div>
                      <span style={{
                        background:`${colors.text}20`, border:`1px solid ${colors.text}40`,
                        color:colors.text, borderRadius:20, padding:'3px 10px',
                        fontSize:10, fontWeight:700, textTransform:'uppercase',
                        display:'flex', alignItems:'center', gap:4,
                      }}>{colors.icon} {pay.status}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#AFA9EC' }}>Sender: {pay.sender_name}</div>
                    {pay.penalty_fee > 0 && (
                      <div style={{ marginTop:8, background:'#2d0a0a', border:'1px solid #7f1d1d', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#ef4444' }}>
                        ⚠️ Penalty: ₦{pay.penalty_fee?.toLocaleString()}
                      </div>
                    )}
                    {pay.status === 'pending' && <div style={{ fontSize:11, color:'#854d0e', marginTop:6 }}>⏳ Admin is reviewing...</div>}
                    {pay.status === 'rejected' && <div style={{ fontSize:11, color:'#ef4444', marginTop:6 }}>❌ Rejected. Contact admin on WhatsApp.</div>}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', borderTop:'1px solid #2a2840', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', padding:'20px 24px 40px' }}
            >
              <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 20px' }} />
              <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>Drop Your Receipt</div>
              <div style={{ fontSize:13, color:'#534AB7', marginBottom:24 }}>Fill in your payment details below</div>


              {/* Slot selector - multi select */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>
                  Which slot(s) are you paying for? (tap to select)
                </label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {mySlots.map(slot => {
                    const isSelected = (form.slot_ids || []).includes(slot.id)
                    return (
                      <button key={slot.id}
                        onClick={() => {
                          const current = form.slot_ids || []
                          const updated = isSelected
                            ? current.filter(id => id !== slot.id)
                            : [...current, slot.id]
                          set('slot_ids', updated)
                          // Auto calculate total amount
                          const total = updated.length * (group?.amount_per_slot || 0)
                          set('amount', total.toString())
                        }}
                        style={{
                          flex:1, padding:'10px', borderRadius:10,
                          background: isSelected ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : '#1f1d35',
                          border: !isSelected ? '1px solid #2a2840' : 'none',
                          color: isSelected ? '#fff' : '#AFA9EC',
                          fontSize:13, fontWeight:700, cursor:'pointer',
                          minWidth:80,
                        }}
                      >
                        {isSelected ? '✓ ' : ''}Slot #{slot.slot_number}
                      </button>
                    )
                  })}
                </div>
                {(form.slot_ids || []).length > 0 && (
                  <div style={{ fontSize:11, color:'#fbbf24', marginTop:6, fontWeight:600 }}>
                    Total: ₦{((form.slot_ids || []).length * (group?.amount_per_slot || 0)).toLocaleString()}
                  </div>
                )}
              </div>

              {[
                { label:'Sender name (as shown on bank app)', key:'sender_name', type:'text',   placeholder:'e.g. James Okafor' },
                { label:'Payment date',                       key:'payment_date', type:'date',   placeholder:'' },
                { label:'Transaction reference',              key:'transaction_ref', type:'text', placeholder:'e.g. TRF/2026/0512/00123' },
                { label:`Amount paid (₦)`,                   key:'amount',       type:'number', placeholder:`e.g. ${group?.amount_per_slot}` },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}

              {/* Receipt upload */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>Upload receipt screenshot</label>
                <label style={{
                  display:'block', cursor:'pointer',
                  background: receiptPreview ? '#052e16' : '#1f1d35',
                  border:`2px dashed ${receiptPreview ? '#166534' : '#3C3489'}`,
                  borderRadius:14, padding:receiptPreview ? 0 : '20px',
                  textAlign:'center', overflow:'hidden',
                }}>
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="receipt" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize:28, marginBottom:8 }}>📸</div>
                      <div style={{ fontSize:13, color:'#534AB7', fontWeight:600 }}>Tap to upload receipt</div>
                      <div style={{ fontSize:11, color:'#3C3489', marginTop:4 }}>JPG, PNG or PDF · Max 5MB</div>
                    </div>
                  )}
                  <input type="file" accept="image/*,application/pdf" onChange={handleReceipt} style={{ display:'none' }} />
                </label>
                {receiptPreview && (
                  <button onClick={() => { setReceipt(null); setReceiptPreview(null) }}
                    style={{ background:'none', border:'none', color:'#ef4444', fontSize:12, cursor:'pointer', marginTop:6 }}>✕ Remove</button>
                )}
              </div>

              <div style={{ background:'#1f1d35', border:'1px solid #2a2840', borderRadius:12, padding:12, marginBottom:20, fontSize:12, color:'#534AB7', lineHeight:1.7 }}>
                📋 Admin will review your receipt and approve your payment. You will be notified once confirmed.
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'13px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <motion.button whileTap={{ scale:0.97 }} onClick={submitPayment} disabled={submitting}
                  style={{
                    flex:2, padding:'13px',
                    background: submitting ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                    border:'none', color: submitting ? '#534AB7' : '#3a1f00',
                    borderRadius:12, fontSize:14, fontWeight:800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}>{submitting ? 'Submitting...' : 'Submit Payment ✦'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
