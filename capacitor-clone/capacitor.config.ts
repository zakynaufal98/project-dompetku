import type { CapacitorConfig } from '@capacitor/cli'

const devServerUrl = process.env.CAP_DEV_SERVER_URL?.trim()
const useLiveReload = Boolean(devServerUrl)
const devServer = devServerUrl ? new URL(devServerUrl) : null
const liveHost = devServer?.hostname || '10.0.2.2'

const config: CapacitorConfig = {
  appId: 'com.dompetku.pro',
  appName: 'DompetKu Pro',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: useLiveReload && devServer?.protocol === 'http:' ? 'http' : 'https',
    ...(useLiveReload
      ? {
          url: devServerUrl,
          cleartext: devServerUrl?.startsWith('http://'),
          allowNavigation: [liveHost, `${liveHost}:5173`, 'localhost', '127.0.0.1'],
        }
      : {}),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#eef4e8',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#eef4e8',
    },
  },
}

export default config
