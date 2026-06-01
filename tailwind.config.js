export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand primary — dipakai untuk button, link, badge, dll.
        primary: {
          DEFAULT: "#A44A4A", // base
          dark:    "#8f3e3e", // hover / pressed
          deep:    "#9F4A4A", // chart accent
        },
        background: "#F5F6FA",
      },
    },
  },
  plugins: [],
};