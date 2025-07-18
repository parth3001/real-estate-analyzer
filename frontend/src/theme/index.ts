import { appleTheme } from './appleTheme';

// Create Apple-inspired theme for the PropTech platform
const theme = appleTheme;

// Add custom mixins
theme.mixins = {
  ...theme.mixins,
  toolbar: {
    minHeight: 64,
    '@media (min-width: 0px) and (orientation: landscape)': {
      minHeight: 48,
    },
    '@media (min-width: 600px)': {
      minHeight: 64,
    },
  },
};

export default theme;