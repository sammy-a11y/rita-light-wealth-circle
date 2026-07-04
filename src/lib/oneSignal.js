// src/lib/oneSignal.js
const ONESIGNAL_APP_ID = '32a043be-37ea-4053-b83c-f3c13e97c4f5'

export const initOneSignal = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    })
  })
}

// Call this after login — links Supabase user ID to OneSignal
export const loginOneSignalUser = async (supabaseUserId) => {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      // Request permission first (native browser prompt)
      const permission = await OneSignal.Notifications.requestPermission()
      console.log('[OneSignal] permission:', permission)
      // Link user
      await OneSignal.login(supabaseUserId)
      console.log('[OneSignal] user linked:', supabaseUserId)
    } catch (err) {
      console.warn('[OneSignal] error:', err)
    }
  })
}

export const logoutOneSignalUser = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal) {
    try { await OneSignal.logout() } catch (e) {}
  })
}