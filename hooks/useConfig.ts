import { useState, useEffect, useCallback } from 'react';
import type { Config } from '../types';

const CONFIG_STORAGE_KEY = 'samSoftConfig';

export const useConfig = () => {
  const [config, setInternalConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // This custom setter will be returned by the hook.
  // It ensures any change to the config state is immediately persisted to localStorage.
  const setConfig = useCallback((value: React.SetStateAction<Config | null>) => {
    setInternalConfig(currentConfig => {
      const newConfig = value instanceof Function ? value(currentConfig) : value;
      if (newConfig) {
        try {
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
        } catch (err) {
          console.error("Failed to persist config to localStorage", err);
        }
      } else {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
      return newConfig;
    });
  }, []);

  useEffect(() => {
    const initializeConfig = async () => {
      setLoading(true);
      setError(null);

      // Priority 1: Try to load from localStorage cache.
      // This preserves user edits across page reloads.
      try {
        const cachedConfigJSON = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (cachedConfigJSON) {
          const parsedConfig = JSON.parse(cachedConfigJSON);
          if (parsedConfig && parsedConfig.siteName) {
            setInternalConfig(parsedConfig);
            setLoading(false);
            return; // Success: Loaded from cache.
          }
        }
      } catch (e) {
        console.warn("Could not parse cached config. It will be ignored.", e);
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }

      // Priority 2: If cache is empty or invalid, fetch from network.
      try {
        // Load the local bootstrap file to get the Gist URL
        const bootstrapResponse = await fetch('/config.json');
        if (!bootstrapResponse.ok) throw new Error(`Could not load bootstrap file: ${bootstrapResponse.status}`);
        const bootstrapConfig = await bootstrapResponse.json();
        
        const gistRawUrl = bootstrapConfig.gistRawUrl;

        if (gistRawUrl && typeof gistRawUrl === 'string' && gistRawUrl.trim() !== '') {
          // Attempt to fetch the live config from Gist
          try {
            const url = new URL(gistRawUrl);
            url.searchParams.set('_', new Date().getTime().toString());
            const mainResponse = await fetch(url.toString());
            if (!mainResponse.ok) throw new Error(`Gist fetch failed with status ${mainResponse.status}`);
            
            const liveConfig = await mainResponse.json();
            
            if (typeof liveConfig === 'object' && liveConfig !== null && liveConfig.siteName) {
              setConfig(liveConfig); // Use our setter to update state and cache
              return; // Success: Loaded from Gist.
            } else {
              throw new Error('Invalid or empty config received from Gist.');
            }
          } catch (gistError) {
            // Priority 3: Fallback to local bootstrap file if Gist fails
            console.warn(`Could not load from Gist. Falling back to local default config.`, gistError);
            setConfig(bootstrapConfig); // Use setter to update state and cache
            return;
          }
        } else {
          // No Gist URL provided, use the local bootstrap file as the primary source.
          setConfig(bootstrapConfig);
          return;
        }
      } catch (e) {
        // Priority 4: All loading methods failed.
        console.error("Critical configuration loading failed.", e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    initializeConfig();
  }, [setConfig]);

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
