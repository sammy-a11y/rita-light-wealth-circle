// src/lib/usePush.js
// Call sendApprovalPush, sendDeclinePush etc from your admin actions

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`

async function callPush(type, payload) {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, payload }),
    })
    const data = await res.json()
    return data
  } catch (err) {
    console.warn('[push] failed to send:', err)
  }
}

// Call when admin approves a request
export const sendApprovalPush = (userId, groupName) =>
  callPush('approved', { userId, groupName })

// Call when admin declines a request
export const sendDeclinePush = (userId, groupName) =>
  callPush('declined', { userId, groupName })

// Call for payment reminder (pass group ID, Edge Function finds all members)
export const sendPaymentReminderPush = (groupId) =>
  callPush('payment_reminder', { groupId })

// Call when admin sets payout for a slot tomorrow
export const sendPayoutReminderPush = (groupId, recipientUserId) =>
  callPush('payout_reminder', { groupId, recipientUserId })
