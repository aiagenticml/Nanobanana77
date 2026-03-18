export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#1a1a1a',
          50: '#2a2a2a',
          100: '#333333',
          200: '#3d3d3d',
        },
        card: {
          DEFAULT: '#242424',
          hover: '#2c2c2c',
        },
        border: {
          DEFAULT: '#333333',
          light: '#3d3d3d',
        },
        text: {
          DEFAULT: '#e5e0db',
          secondary: '#9a948e',
          muted: '#6b6560',
        },
        accent: {
          DEFAULT: '#c4956a',
          hover: '#d4a57a',
          muted: '#8b7355',
        },
        profit: {
          DEFAULT: '#7da47a',
          muted: '#5a7a58',
        },
        loss: {
          DEFAULT: '#c47a7a',
          muted: '#8a5555',
        },
      },
    },
  },
  plugins: [],
}
