/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Pindex palette
        'pin-red':    '#CD0808',
        'pin-blue':   '#06A5DF',
        'pin-green':  '#1EC209',
        'pin-yellow': '#E6CA0F',
        'pin-purple': '#6004BC',
        'off-white':  '#FFFFFA',
        'deep-black': '#000E19',
      },
      borderRadius: {
        card:   '20px',
        btn:    '14px',
      },
      fontFamily: {
        'monda':      ['Monda_400Regular'],
        'monda-bold': ['Monda_700Bold'],
      },
    },
  },
  plugins: [],
}