
import { useState, useEffect, useCallback } from 'react';
import type { Config } from '../types';

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Config = await response.json();
        setConfig(data);
      } catch (e: unknown) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const saveConfig = useCallback(() => {
    if (!config) return;

    try {
      const configString = JSON.stringify(config, null, 2);
      const blob = new Blob([configString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to save config:", e)
        alert("فشل حفظ الإعدادات. انظر إلى الكونسول للمزيد من التفاصيل.")
    }
  }, [config]);

  return { config, loading, error, setConfig, saveConfig };
};
