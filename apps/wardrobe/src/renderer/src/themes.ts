/**
 * Colour themes.
 *
 * A theme is just a set of the CSS custom properties the stylesheet already
 * reads. Applying one writes those properties inline on <html>, which beats
 * the stylesheet's own :root rules — including the dark-mode media query — so
 * a chosen theme always wins. Clearing them hands control back to the
 * stylesheet, which is what "Follow system" does.
 */

export interface Theme {
  id: string;
  name: string;
  note: string;
  vars: Record<string, string>;
}

/** Every property a theme must define, so none can be left dangling. */
const KEYS = [
  '--bg',
  '--surface',
  '--surface-2',
  '--border',
  '--shadow',
  '--text',
  '--text-muted',
  '--accent',
  '--accent-hover',
  '--accent-text',
  '--danger',
  '--gold',
  '--clean',
  '--dirty',
  '--laundry',
  '--thread',
  '--sprite-line',
] as const;

export const SYSTEM_THEME_ID = 'system';

/**
 * Colours are tuned so foreground values clear 4.5:1 against their own surface
 * (3:1 for the favourite star, which is an icon rather than text). That nudges
 * a few shades of the borrowed palettes off their published hex values; hue and
 * saturation are preserved, only lightness moves.
 */
export const THEMES: Theme[] = [
  {
    id: 'cottage-day',
    name: 'Cottage Day',
    note: 'Linen and sage',
    vars: {
      '--bg': '#e9d9bc',
      '--surface': '#fbf3e2',
      '--surface-2': '#e5d3b3',
      '--border': '#7d5f45',
      '--shadow': '#7d5f45',
      '--text': '#453626',
      '--text-muted': '#826950',
      '--accent': '#597548',
      '--accent-hover': '#485f3a',
      '--accent-text': '#fbf3e2',
      '--danger': '#b0503a',
      '--gold': '#b48123',
      '--clean': '#4b793d',
      '--dirty': '#906819',
      '--laundry': '#53728e',
      '--thread': 'rgb(125 95 69 / 9%)',
      '--sprite-line': '#6b5138',
    },
  },
  {
    id: 'cottage-night',
    name: 'Cottage Night',
    note: 'Lantern-lit timber',
    vars: {
      '--bg': '#241c15',
      '--surface': '#362b21',
      '--surface-2': '#46372a',
      '--border': '#8a6a4c',
      '--shadow': '#140f0a',
      '--text': '#f1e2c8',
      '--text-muted': '#b39a78',
      '--accent': '#8fb173',
      '--accent-hover': '#a1be8a',
      '--accent-text': '#211a13',
      '--danger': '#dd8065',
      '--gold': '#e6b556',
      '--clean': '#86bb6b',
      '--dirty': '#d7a747',
      '--laundry': '#83a8c6',
      '--thread': 'rgb(241 226 200 / 5%)',
      '--sprite-line': '#d8c3a0',
    },
  },
  {
    id: 'game-boy',
    name: 'Game Boy',
    note: 'The original four greens',
    vars: {
      '--bg': '#8bac0f',
      '--surface': '#9bbc0f',
      '--surface-2': '#7d9c0d',
      '--border': '#0f380f',
      '--shadow': '#0f380f',
      '--text': '#0f380f',
      '--text-muted': '#224821',
      '--accent': '#244a24',
      '--accent-hover': '#183218',
      '--accent-text': '#9bbc0f',
      '--danger': '#5c2c0d',
      '--gold': '#0f380f',
      // The hardware palette is only four greens, which leaves the statuses
      // indistinguishable and the middle one barely legible. These stay muted
      // and dark enough to read on the light green surface.
      '--clean': '#1d4a1d',
      '--dirty': '#563a04',
      '--laundry': '#0f380f',
      '--thread': 'rgb(15 56 15 / 10%)',
      '--sprite-line': '#0f380f',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    note: 'Cool arctic blues',
    vars: {
      '--bg': '#2e3440',
      '--surface': '#3b4252',
      '--surface-2': '#434c5e',
      '--border': '#5b6880',
      '--shadow': '#20242d',
      '--text': '#eceff4',
      '--text-muted': '#a6b1c2',
      '--accent': '#88c0d0',
      '--accent-hover': '#a2ceda',
      '--accent-text': '#2e3440',
      '--danger': '#d89fa4',
      '--gold': '#ebcb8b',
      '--clean': '#a3be8c',
      '--dirty': '#daa18f',
      '--laundry': '#99b3cd',
      '--thread': 'rgb(236 239 244 / 4%)',
      '--sprite-line': '#d8dee9',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    note: 'Purple and neon',
    vars: {
      '--bg': '#282a36',
      '--surface': '#343746',
      '--surface-2': '#44475a',
      '--border': '#6272a4',
      '--shadow': '#191a21',
      '--text': '#f8f8f2',
      '--text-muted': '#9aa5ce',
      '--accent': '#bd93f9',
      '--accent-hover': '#d2b5fb',
      '--accent-text': '#282a36',
      '--danger': '#ff7979',
      '--gold': '#f1fa8c',
      '--clean': '#50fa7b',
      '--dirty': '#ffb86c',
      '--laundry': '#8be9fd',
      '--thread': 'rgb(248 248 242 / 4%)',
      '--sprite-line': '#f8f8f2',
    },
  },
  {
    id: 'rose-pine-dawn',
    name: 'Rosé Pine Dawn',
    note: 'Soft rose on paper',
    vars: {
      '--bg': '#faf4ed',
      '--surface': '#fffaf3',
      '--surface-2': '#f2e9e1',
      '--border': '#575279',
      '--shadow': '#575279',
      '--text': '#575279',
      '--text-muted': '#746f8e',
      '--accent': '#c54944',
      '--accent-hover': '#af3b36',
      '--accent-text': '#fffaf3',
      '--danger': '#af5971',
      '--gold': '#cc7e15',
      '--clean': '#286983',
      '--dirty': '#a26511',
      '--laundry': '#80679d',
      '--thread': 'rgb(87 82 121 / 8%)',
      '--sprite-line': '#575279',
    },
  },
];

for (const theme of THEMES) {
  for (const key of KEYS) {
    if (!(key in theme.vars)) throw new Error(`Theme ${theme.id} is missing ${key}`);
  }
}

const STORAGE_KEY = 'wardrobe.theme';

export function loadThemeId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === SYSTEM_THEME_ID || THEMES.some((t) => t.id === saved))) return saved;
  } catch {
    // Storage can be unavailable; falling back to the system theme is fine.
  }
  return SYSTEM_THEME_ID;
}

export function applyTheme(id: string): void {
  const root = document.documentElement;
  const theme = THEMES.find((candidate) => candidate.id === id);

  if (!theme) {
    // "Follow system": drop the overrides and let the stylesheet decide.
    for (const key of KEYS) root.style.removeProperty(key);
  } else {
    for (const key of KEYS) root.style.setProperty(key, theme.vars[key] as string);
  }

  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Not being able to remember the choice should never break the app.
  }
}
