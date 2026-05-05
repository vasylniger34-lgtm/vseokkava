import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: any;
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();
      setTg(webapp);
    }
  }, []);

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData,
  };
}
