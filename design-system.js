// ============================================================================
// NziCode Flat Design System — a single, reusable visual language for every
// NziCode app (RTL-first). Import `NziTheme` for raw tokens, or the `ui`
// helpers below for ready-made React Native StyleSheet fragments so every
// app shares the exact same spacing, radius, type scale, and flat
// (near-shadowless) surface language instead of each screen inventing its
// own numbers.
//
// Usage in an app:
//   import { NziTheme, ui } from './design-system';
//   const styles = StyleSheet.create({
//     card: ui.card(),
//     title: ui.text('title'),
//   });
// ============================================================================

export const NziTheme = {
  direction: 'rtl',
  fontFamily: 'Vazirmatn',

  // ---- Color -----------------------------------------------------------
  // One accent, flat neutrals, flat semantic colors. No gradients.
  colors: {
    primary: '#5B4FE9',
    primaryDark: '#4238C4',
    primarySoft: '#EEECFD',
    accent: '#FF6B54',
    accentSoft: '#FFEAE5',

    ink: '#14151F',
    muted: '#71758A',
    faint: '#A6A9BB',

    surface: '#FFFFFF',
    surfaceAlt: '#F7F7FB',
    background: '#F3F3F8',
    line: '#E7E7EF',

    dark: '#1D1B2E',
    darkSoft: '#332F4E',

    success: '#1FAE7A',
    successSoft: '#E3F8EF',
    warning: '#E3A427',
    warningSoft: '#FDF3DE',
    danger: '#E5484D',
    dangerSoft: '#FCE8E8',
  },

  // ---- Scale -------------------------------------------------------------
  // Every spacing/radius value in the app should come from one of these —
  // no ad-hoc numbers. Keeps every screen visually consistent by construction.
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 },

  radius: {
    xs: 8,     // small chips, checkboxes
    sm: 12,    // icon badges, inputs
    md: 16,    // buttons, list rows
    lg: 20,    // cards
    xl: 26,    // hero cards, modal sheets
    pill: 999, // fully rounded pills/avatars
  },

  // ---- Type ----------------------------------------------------------
  typography: {
    weight: { regular: '400', medium: '600', bold: '700', extraBold: '800' },
    scale: {
      display: 26,
      title: 19,
      subtitle: 15,
      body: 14,
      caption: 12,
      micro: 11,
    },
  },

  // ---- Elevation -------------------------------------------------------
  // Flat design = elevation communicated with borders/color, not deep
  // shadows. Only ONE soft shadow token exists, meant for floating
  // elements (bottom nav, FAB) — everything else uses a 1px border.
  shadow: {
    none: {},
    floating: {
      shadowColor: '#14151F',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },

  border: { hairline: 1, thick: 1.5 },
};

// ============================================================================
// Component style helpers — flat, bordered surfaces instead of shadows;
// consistent radius/spacing from the scale above. Every helper returns a
// plain style object, ready to spread into StyleSheet.create().
// ============================================================================
const { colors, spacing, radius, typography } = NziTheme;

export const ui = {
  // Flat card: white surface + hairline border, no shadow.
  card: (overrides = {}) => ({
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: NziTheme.border.hairline,
    borderColor: colors.line,
    padding: spacing.lg,
    ...overrides,
  }),

  // Primary flat button: solid fill, no shadow, medium radius.
  button: (variant = 'primary') => {
    const base = {
      minHeight: 50,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    };
    if (variant === 'primary') return { ...base, backgroundColor: colors.primary };
    if (variant === 'danger') return { ...base, backgroundColor: colors.dangerSoft };
    if (variant === 'ghost') return { ...base, backgroundColor: 'transparent' };
    // secondary
    return { ...base, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
  },

  input: () => ({
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: NziTheme.border.hairline,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: NziTheme.fontFamily,
    fontSize: typography.scale.body,
    color: colors.ink,
  }),

  // A single flat row inside a list (icon + label + trailing control).
  listRow: () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: NziTheme.border.hairline,
    borderColor: colors.line,
  }),

  pill: (active = false) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: active ? colors.primary : colors.surface,
    borderWidth: active ? 0 : NziTheme.border.hairline,
    borderColor: colors.line,
  }),

  badge: (tone = 'primary') => {
    const tones = {
      primary: colors.primarySoft,
      success: colors.successSoft,
      warning: colors.warningSoft,
      danger: colors.dangerSoft,
    };
    return {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: tones[tone] || tones.primary,
    };
  },

  // Text presets keyed to the type scale above.
  text: (preset = 'body') => {
    const presets = {
      display: { fontSize: typography.scale.display, fontWeight: typography.weight.extraBold, color: colors.ink },
      title: { fontSize: typography.scale.title, fontWeight: typography.weight.bold, color: colors.ink },
      subtitle: { fontSize: typography.scale.subtitle, fontWeight: typography.weight.medium, color: colors.ink },
      body: { fontSize: typography.scale.body, fontWeight: typography.weight.regular, color: colors.ink },
      caption: { fontSize: typography.scale.caption, fontWeight: typography.weight.regular, color: colors.muted },
      micro: { fontSize: typography.scale.micro, fontWeight: typography.weight.regular, color: colors.faint },
    };
    return { fontFamily: NziTheme.fontFamily, textAlign: 'right', ...(presets[preset] || presets.body) };
  },
};
