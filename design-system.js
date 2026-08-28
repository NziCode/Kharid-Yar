// Shared NziCode visual language for future apps.
export const NziTheme = {
  direction: 'rtl',
  fontFamily: 'Vazirmatn',
  colors: {
    primary: '#635BEE',
    primaryDark: '#4740BE',
    primarySoft: '#ECEAFF',
    accent: '#FF775C',
    ink: '#1B1D2A',
    muted: '#7C8295',
    faint: '#AAB0C0',
    surface: '#FFFFFF',
    background: '#F5F6FB',
    darkSurface: '#24213F',
    success: '#27B887',
    successSoft: '#DDF8EE',
    line: '#EAEBF2',
  },
  radius: { card: 17, sheet: 29, button: 16, pill: 15 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 18, xl: 24, xxl: 32 },
  typography: { regular: 400, medium: 600, bold: 700, extraBold: 900 },
  shadow: {
    card: { shadowColor: '#1B1D2A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
    button: { shadowColor: '#635BEE', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  },
};
