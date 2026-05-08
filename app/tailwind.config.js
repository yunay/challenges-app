/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Class-based dark mode. NativeWind v4 web runtime requires this when the
  // host platform may set color scheme programmatically (Expo does); the
  // default 'media' strategy throws when Appearance.setColorScheme is called.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        surface: '#FFFFFF',
        surface2: '#F4F2EC',
        fg1: '#18221E',
        fg2: '#4A574F',
        fg3: '#7C8881',
        fg4: '#B0B8B3',
        border1: '#ECEAE3',
        border2: '#DAD8D0',
        accent: '#D97706',
        accentBg: '#FEF6E7',
        accentBorder: '#FBD08A',
        catHealth: '#B5523F',
        catMental: '#7E6FA8',
      },
      fontFamily: {
        display: ['PlusJakartaSans_700Bold'],
        displaySemi: ['PlusJakartaSans_600SemiBold'],
        body: ['Inter_400Regular'],
        bodyMedium: ['Inter_500Medium'],
      },
      borderRadius: {
        'r-sm': '8px',
        'r-md': '10px',
        'r-lg': '12px',
        'r-xl': '14px',
        'r-2xl': '16px',
      },
    },
  },
  plugins: [],
};
