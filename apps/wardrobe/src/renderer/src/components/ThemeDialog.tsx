import { SYSTEM_THEME_ID, THEMES } from '../themes.js';
import type { Theme } from '../themes.js';
import { Dialog } from './Dialog.js';

interface ThemeDialogProps {
  current: string;
  onChoose(id: string): void;
  onClose(): void;
}

/** The colours worth previewing on a swatch, in the order they read best. */
const SWATCH_KEYS = ['--bg', '--surface', '--accent', '--gold', '--border'] as const;

export function ThemeDialog({ current, onChoose, onClose }: ThemeDialogProps) {
  return (
    <Dialog
      wide
      title="Theme"
      onClose={onClose}
      footer={
        <>
          <span className="hint">Applies straight away and is remembered.</span>
          <div className="spacer" />
          <button type="button" className="button button--primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="themes">
        <button
          type="button"
          className={current === SYSTEM_THEME_ID ? 'theme theme--on' : 'theme'}
          onClick={() => onChoose(SYSTEM_THEME_ID)}
          aria-pressed={current === SYSTEM_THEME_ID}
        >
          <span className="theme__swatches theme__swatches--system">
            <span style={{ background: '#e9d9bc' }} />
            <span style={{ background: '#fbf3e2' }} />
            <span style={{ background: '#6f9159' }} />
            <span style={{ background: '#362b21' }} />
            <span style={{ background: '#241c15' }} />
          </span>
          <strong>Follow system</strong>
          <span className="hint">Cottage, light or dark</span>
        </button>

        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={theme.id === current}
            onChoose={() => onChoose(theme.id)}
          />
        ))}
      </div>
    </Dialog>
  );
}

function ThemeCard({
  theme,
  selected,
  onChoose,
}: {
  theme: Theme;
  selected: boolean;
  onChoose(): void;
}) {
  return (
    <button
      type="button"
      className={selected ? 'theme theme--on' : 'theme'}
      onClick={onChoose}
      aria-pressed={selected}
    >
      <span className="theme__swatches">
        {SWATCH_KEYS.map((key) => (
          <span key={key} style={{ background: theme.vars[key] }} />
        ))}
      </span>
      <strong>{theme.name}</strong>
      <span className="hint">{theme.note}</span>
    </button>
  );
}
