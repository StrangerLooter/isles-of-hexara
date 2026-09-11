import React, { useEffect, useState } from 'react';
import HomePage from './app/page';
import GamePage from './app/game/page';
import { LoadingScreen } from './components/common/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<'home' | 'game'>(() => {
    return window.location.hash.includes('/game') || window.location.pathname.includes('/game')
      ? 'game'
      : 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('/game') || window.location.pathname.includes('/game')) {
        setRoute('game');
      } else {
        setRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen onLoaded={() => setIsLoading(false)} />;
  }

  return route === 'game' ? <GamePage /> : <HomePage />;
}
