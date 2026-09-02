import hangerIcon from '../assets/icons/hanger.svg';

/**
 * The window is frameless, so this replaces the native title bar. The bar
 * itself is a drag region; the buttons opt out of it so they stay clickable.
 */
interface TitleBarProps {
  onOpenThemes(): void;
}

export function TitleBar({ onOpenThemes }: TitleBarProps) {
  return (
    <header className="titlebar">
      <div className="titlebar__title">
        <img className="titlebar__mark" src={hangerIcon} alt="" />
        <span>Wardrobe Tracker</span>
      </div>

      <div className="titlebar__controls">
        <button
          type="button"
          className="titlebar__button titlebar__button--theme"
          onClick={onOpenThemes}
          aria-label="Change theme"
          title="Change theme"
        />
        <button
          type="button"
          className="titlebar__button titlebar__button--minimize"
          onClick={() => void window.wardrobe.window.minimize()}
          aria-label="Minimise"
        />
        <button
          type="button"
          className="titlebar__button titlebar__button--maximize"
          onClick={() => void window.wardrobe.window.toggleMaximize()}
          aria-label="Maximise"
        />
        <button
          type="button"
          className="titlebar__button titlebar__button--close"
          onClick={() => void window.wardrobe.window.close()}
          aria-label="Close"
        />
      </div>
    </header>
  );
}
