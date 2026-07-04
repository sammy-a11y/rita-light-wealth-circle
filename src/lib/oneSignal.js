// src/lib/oneSignal.js
// Helper to init OneSignal and link user to their Supabase ID

const ONESIGNAL_APP_ID = '32a043be-37ea-4053-b83c-f3c13e97c4f5'

export const initOneSignal = () => {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/' },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: true,
                text: {
                  actionMessage:
                    'Rita Light will notify you when it\'s time to pay, when you get approved, and when your payout is ready.',
                  acceptButton: 'Allow',
                  cancelButton: 'Later',
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 3,
                },
              },
            ],
          },
        },
        welcomeNotification: {
          title: 'Rita Light Wealth Circle™',
          message: 'You\'re all set! We\'ll notify you for payments and payouts 🎉',
        },
      })
      resolve(OneSignal)
    })
  })
}

// Call this after user logs in — links their Supabase user ID to OneSignal
export const loginOneSignalUser = async (supabaseUserId) => {
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.login(supabaseUserId)
      console.log('[OneSignal] User linked:', supabaseUserId)
    })
  } catch (err) {
    console.warn('[OneSignal] login failed:', err)
  }
}

// Call this on logout
export const logoutOneSignalUser = () => {
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.logout()
    })
  } catch (err) {
    console.warn('[OneSignal] logout failed:', err)
  }
}
