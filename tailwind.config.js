import formsPlugin from '@tailwindcss/forms';
import typographyPlugin from '@tailwindcss/typography';
import aspectRatioPlugin from '@tailwindcss/aspect-ratio';
import defaultTheme from 'tailwindcss/defaultTheme';

// Custom color with css variable color in __theme_color.scss
function customColors(cssVar) {
  return ({opacityVariable, opacityValue}) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${cssVar}), ${opacityValue})`;
    }
    if (opacityVariable !== undefined) {
      return `rgba(var(${cssVar}), var(${opacityVariable}, 1))`;
    }
    return `rgb(var(${cssVar}))`;
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'false',
  theme: {
    fontFamily: {
      display: ['"nudista-web"', 'sans-serif'],
      body: ['"nudista-web"', 'sans-serif'],
      headline: ['"nudista-web"', 'sans-serif'],
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '6rem',
        xl: '6rem',
        '2xl': '6rem',
      },
      screens: {
        ...defaultTheme.screens,
        '2xl': '1312px',
        '3xl': '1440px',
        '4xl': '1770px',
      },
    },
    extend: {
      colors: {
        primaryShopify: 'rgb(var(--color-primary-shopify) / <alpha-value>)',
        contrast: 'rgb(var(--color-contrast) / <alpha-value>)',
        notice: 'rgb(var(--color-accent) / <alpha-value>)',
        shopPay: 'rgb(var(--color-shop-pay) / <alpha-value>)',
        primary: {
          50: customColors('--c-primary-50'),
          100: customColors('--c-primary-100'),
          200: customColors('--c-primary-200'),
          300: customColors('--c-primary-300'),
          400: customColors('--c-primary-400'),
          500: customColors('--c-primary-500'),
          600: customColors('--c-primary-600'),
          700: customColors('--c-primary-700'),
          800: customColors('--c-primary-800'),
          900: customColors('--c-primary-900'),
        },
        secondary: {
          50: customColors('--c-secondary-50'),
          100: customColors('--c-secondary-100'),
          200: customColors('--c-secondary-200'),
          300: customColors('--c-secondary-300'),
          400: customColors('--c-secondary-400'),
          500: customColors('--c-secondary-500'),
          600: customColors('--c-secondary-600'),
          700: customColors('--c-secondary-700'),
          800: customColors('--c-secondary-800'),
          900: customColors('--c-secondary-900'),
        },
      },
      screens: {
        // sm: '32em',
        // md: '48em',
        // lg: '64em',
        // xl: '80em',
        // '2xl': '96em',
        ...defaultTheme.screens,
        '3xl': '1440px',
        '4xl': '1770px',
        'sm-max': {max: defaultTheme.screens.md},
        'sm-only': {min: defaultTheme.screens.sm, max: defaultTheme.screens.md},
        'md-only': {min: defaultTheme.screens.md, max: defaultTheme.screens.lg},
        'lg-only': {min: defaultTheme.screens.lg, max: defaultTheme.screens.xl},
        'xl-only': {
          min: defaultTheme.screens.xl,
          max: defaultTheme.screens['2xl'],
        },
        '2xl-only': {min: defaultTheme.screens['2xl']},
      },
      spacing: {
        nav: 'var(--height-nav)',
        screen: 'var(--screen-height, 100vh)',
      },
      height: {
        screen: 'var(--screen-height, 100vh)',
        'screen-no-nav':
          'calc(var(--screen-height, 100vh) - var(--height-nav))',
        'screen-dynamic': 'var(--screen-height-dynamic, 100vh)',
      },
      width: {
        mobileGallery: 'calc(100vw - 4rem)',
      },
      fontFamily: {
        sans: ['"nudista-web"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"nudista-web"', 'Palatino', 'ui-serif'],
      },
      fontSize: {
        display: ['var(--font-size-display)', '1.1'],
        heading: ['var(--font-size-heading)', '1.25'],
        lead: ['var(--font-size-lead)', '1.333'],
        copy: ['var(--font-size-copy)', '1.5'],
        fine: ['var(--font-size-fine)', '1.333'],
      },
      maxWidth: {
        'prose-narrow': '45ch',
        'prose-wide': '80ch',
      },
      boxShadow: {
        border: 'inset 0px 0px 0px 1px rgb(var(--color-primary) / 0.08)',
        darkHeader: 'inset 0px -1px 0px 0px rgba(21, 21, 21, 0.4)',
        lightHeader: 'inset 0px -1px 0px 0px rgba(21, 21, 21, 0.05)',
      },
    },
  },
  plugins: [formsPlugin, typographyPlugin, aspectRatioPlugin],
};
