// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // ✅ Required for Angular
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      inset: ["portrait", "landscape"],
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function ({ addVariant }) {
      addVariant("portrait", "@media (orientation: portrait)");
      addVariant("landscape", "@media (orientation: landscape)");
    },
  ],
};
