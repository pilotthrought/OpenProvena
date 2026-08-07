// Configuration Tailwind CSS pour OpenProvena
// Thème clair inspiré de NYT, Google, Apple et GitHub

/** @type {import('tailwindcss').Config} */
module.exports = {
  // PurgeCSS pour optimiser le CSS final
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Thème par défaut
  theme: {
    extend: {
      // Palette de couleurs professionnelle - Bleu OpenProvena
      colors: {
        // Couleurs principales - bleu confiance #2557B8
        primary: {
          50: '#f0f5fc',
          100: '#d9e4f5',
          200: '#b3c9eb',
          300: '#8daee1',
          400: '#6793d7',
          500: '#4178cd',
          600: '#2557B8',  // Couleur principale
          700: '#1e4a9e',
          800: '#183d85',
          900: '#12316c',
          950: '#0c2552',
        },
        // Couleurs secondaires - gris sobre
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Couleurs d'état pour la crédibilité
        trust: {
          high: '#10b981',    // Vert - confiance élevée
          medium: '#f59e0b',  // Orange - confiance moyenne
          low: '#ef4444',      // Rouge - confiance faible
          unknown: '#6b7280',  // Gris - inconnu
        },
        // Couleurs du spectre de confiance
        spectrum: {
          0: '#ef4444',   // Très faible
          20: '#f97316',  // Faible
          40: '#f59e0b',  // Modéré
          60: '#eab308',  // Moyen
          80: '#84cc16',  // Élevé
          100: '#10b981', // Très élevé
        },
      },
      // Typographie basée sur Inter
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      // Espacements personnalisés
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '128': '32rem',
      },
      // Rayons de bordure modernes
      borderRadius: {
        '4xl': '2rem',
      },
      // Ombres subtiles inspirées Apple/GitHub
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'glow': '0 0 20px rgb(59 130 246 / 0.15)',
      },
      // Animations fluides
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
};
