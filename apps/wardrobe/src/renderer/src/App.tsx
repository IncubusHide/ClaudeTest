import { useState } from 'react';
import { LaundryView } from './components/LaundryView.js';
import { OutfitsView } from './components/OutfitsView.js';
import { Sidebar } from './components/Sidebar.js';
import { TitleBar } from './components/TitleBar.js';
import type { ViewName } from './components/Sidebar.js';
import { WardrobeView } from './components/WardrobeView.js';
import { useWardrobe } from './useWardrobe.js';

export function App() {
  const store = useWardrobe();
  const [view, setView] = useState<ViewName>('wardrobe');

  if (store.loading) {
    return (
      <div className="shell">
        <TitleBar />
        <div className="loading">Opening your wardrobe…</div>
      </div>
    );
  }

  return (
    <div className="shell">
      <TitleBar />
      <div className="app">
        <Sidebar
          active={view}
          onNavigate={setView}
          items={store.items}
          outfitCount={store.outfits.length}
        />

        <main className="main">
        {store.error ? (
          <div className="banner" role="alert">
            <span>{store.error}</span>
            <button type="button" className="icon-button" onClick={store.dismissError}>
              ×
            </button>
          </div>
        ) : null}

        {view === 'wardrobe' ? <WardrobeView store={store} /> : null}
        {view === 'outfits' ? <OutfitsView store={store} /> : null}
        {view === 'laundry' ? <LaundryView store={store} /> : null}
        </main>
      </div>
    </div>
  );
}
