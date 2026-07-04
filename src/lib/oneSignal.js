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

export const loginOneSignalUser = async (supabaseUserId) => {
  try {
    // Wait for OneSignal to be ready
    await new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          // Request native browser permission prompt
          await OneSignal.Notifications.requestPermission()
          // Link this device to the Supabase user ID
          await OneSignal.login(supabaseUserId)
          console.log('[OneSignal] linked:', supabaseUserId)
        } catch (e) {
          console.warn('[OneSignal] setup failed:', e)
        }
        resolve()
      })
    })
  } catch (err) {
    console.warn('[OneSignal] outer error:', err)
  }
}

export const logoutOneSignalUser = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal) {
    try { await OneSignal.logout() } catch (e) {}
  })
}
