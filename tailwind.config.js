/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'node-person': '#ff7043',
        'node-product': '#4CAF50',
        'relationship': '#2196F3',
        'canvas-bg': '#ffffff',
        'app-bg': '#f5f5f5',
        'nav-bg': '#333333',
        'sidebar-bg': '#eeeeee'
      }
    },
  },
  plugins: [],
}
