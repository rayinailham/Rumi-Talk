// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  telemetry: false,
  future: {
    compatibilityVersion: 4
  },
  css: ['~/assets/index.css'],
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit'
      ]
    }
  },
  nitro: {
    rollupConfig: {
      // @ts-ignore
      onwarn(warning, rollupWarn) {
        if (warning.message && warning.message.includes('Duplicated imports "useAppConfig"')) return
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('nitropack')) return
        rollupWarn(warning)
      }
    }
  }
})
