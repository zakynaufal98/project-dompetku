export const getAppPlatform = () => {
  if (typeof window === 'undefined') return 'web'

  const ua = window.navigator?.userAgent?.toLowerCase() || ''
  const capacitorPlatform = window.Capacitor?.getPlatform?.() || window.Capacitor?.platform || null
  const origin = window.location?.origin || ''

  if (capacitorPlatform === 'android') return 'android'
  if (origin === 'https://localhost' && ua.includes('android')) return 'android'
  if (origin === 'https://localhost' && capacitorPlatform && capacitorPlatform !== 'web') return capacitorPlatform

  return 'web'
}

export const isAndroidShell = () => getAppPlatform() === 'android'
