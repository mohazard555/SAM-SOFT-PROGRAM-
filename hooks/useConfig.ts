import { useState, useEffect, useCallback } from 'react';
import type { Config } from '../types';

const CONFIG_STORAGE_KEY = 'samSoftConfig';

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const gistRawUrl = localStorage.getItem('gistRawUrl');
      let configLoaded = false;

      // 1. Try to load from localStorage cache first for an instant UI
      try {
        const cachedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (cachedConfig) {
          setConfig(JSON.parse(cachedConfig));
          setLoading(false); // Render with cached data immediately
          configLoaded = true;
        }
      } catch (e) {
        console.error("Failed to parse cached config from localStorage", e);
        // Clear corrupted cache
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
      
      // 2. If a Gist URL is configured, fetch the latest version to keep cache fresh
      if (gistRawUrl) {
        try {
          const url = new URL(gistRawUrl);
          url.searchParams.set('_', new Date().getTime().toString());
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`Gist fetch error! status: ${response.status}`);
          }
          const data: Config = await response.json();
          setConfig(data); // Update state with the freshest data
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data)); // Update cache
          configLoaded = true;
        } catch (e) {
          console.error("Failed to fetch from Gist. Will rely on cached or local config if available.", e);
        }
      }

      // 3. If nothing has been loaded yet (e.g., first visit, no cache, no gist), fall back to local config.json
      if (!configLoaded) {
        try {
          const response = await fetch('/config.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: Config = await response.json();
          setConfig(data);
          // Also cache the local config so it's available next time even if offline
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data));
        } catch (e: unknown) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('An unknown error occurred');
          }
        }
      }
      
      // Finally, set loading to false
      setLoading(false);
    };

    fetchConfig();
  }, []);

  const exportConfig = useCallback(() => {
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

  const saveConfig = useCallback(async (configToSave: Config) => {
    if (!configToSave) return;

    const gistRawUrl = localStorage.getItem('gistRawUrl');
    const githubToken = localStorage.getItem('githubToken');

    if (!gistRawUrl || !githubToken) {
        throw new Error("لم يتم تكوين المزامنة. يرجى إدخال رابط Gist Raw و GitHub Token في إعدادات المزامنة.");
    }

    const match = gistRawUrl.match(/https:\/\/gist\.githubusercontent\.com\/[^\/]+\/([a-fA-F0-9]+)\/raw\/(?:[a-fA-F0-9]+\/)?(.*)$/);

    if (!match) {
        throw new Error("رابط Gist Raw غير صالح. يجب أن يكون بالتنسيق التالي: https://gist.githubusercontent.com/user/id/raw/filename.json");
    }

    const gistId = match[1];
    const filename = decodeURIComponent(match[2]);

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    [filename]: {
                        content: JSON.stringify(configToSave, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`فشل تحديث Gist: ${errorData.message || response.status}`);
        }
        
        // On successful Gist update, also update the local cache
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));

    } catch (e) {
        console.error("Failed to save config to Gist:", e);
        if (e instanceof Error) {
            throw e;
        } else {
            throw new Error("فشل حفظ الإعدادات. انظر إلى الكونسول للمزيد من التفاصيل.");
        }
    }

  }, []);

  return { config, loading, error, setConfig, exportConfig, saveConfig };
};