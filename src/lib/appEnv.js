const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

export const getAuthRedirectBase = () => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_AUTH_REDIRECT_URL || '')
  if (envUrl) return envUrl
  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin)
  }
  return ''
}

export const getAppUrl = (path = '/') => {
  const base = getAuthRedirectBase()
  if (!base) return path
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
