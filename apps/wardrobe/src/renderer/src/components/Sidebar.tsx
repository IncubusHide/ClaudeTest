import { countByStatus } from '@wardrobe/core';
import hangerIcon from '../assets/icons/hanger.svg';
import type { ClothingItem } from '@wardrobe/core';

export type ViewName = 'wardrobe' | 'outfits' | 'laundry';

interface SidebarProps {
  active: ViewName;
  onNavigate(view: ViewName): void;
  items: ClothingItem[];
  outfitCount: number;
}

export function Sidebar({ active, onNavigate, items, outfitCount }: SidebarProps) {
  const counts = countByStatus(items);
  const inWash = counts.dirty + counts.in_laundry;

  const links: { view: ViewName; label: string; badge: number }[] = [
    { view: 'wardrobe', label: 'Wardrobe', badge: items.length },
    { view: 'outfits', label: 'Outfits', badge: outfitCount },
    { view: 'laundry', label: 'Laundry', badge: inWash },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">
          <img src={hangerIcon} alt="" />
        </span>
        <span>Wardrobe</span>
      </div>

      <ul className="sidebar__links">
        {links.map(({ view, label, badge }) => (
          <li key={view}>
            <button
              type="button"
              className={view === active ? 'sidebar__link is-active' : 'sidebar__link'}
              onClick={() => onNavigate(view)}
              aria-current={view === active ? 'page' : undefined}
            >
              <span>{label}</span>
              {badge > 0 ? <span className="sidebar__badge">{badge}</span> : null}
            </button>
          </li>
        ))}
      </ul>

      <p className="sidebar__footer">Everything is stored locally on this computer.</p>
    </nav>
  );
}
