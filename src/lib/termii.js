export const sendOTP = async (phone) => {
  const res = await fetch('https://api.ng.termii.com/api/sms/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key:       import.meta.env.VITE_TERMII_API_KEY,
      message_type:  'NUMERIC',
      to:            phone,
      from:          'Rita Light',
      channel:       'generic',
      pin_attempts:  3,
      pin_time_to_live: 5,
      pin_length:    6,
      pin_placeholder: '< 1234 >',
      message_text:  'Your Rita Light Wealth Circle OTP is < 1234 >. Valid for 5 minutes.',
      pin_type:      'NUMERIC',
    })
  })
  return res.json()
}

export const verifyOTP = async (pin_id, pin) => {
  const res = await fetch('https://api.ng.termii.com/api/sms/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: import.meta.env.VITE_TERMII_API_KEY,
      pin_id,
      pin,
    })
  })
  return res.json()
}