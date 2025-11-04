// DO NOT EDIT - Full file content has been provided below
import React, { useState, useEffect, useCallback } from 'react';
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

      // Priority 1: Fetch from network (Gist) to get the latest version.
      try {
        const bootstrapResponse = await fetch('/config.json', { cache: 'reload' });
        if (!bootstrapResponse.ok) throw new Error(`Could not load bootstrap file: ${bootstrapResponse.status}`);
        const bootstrapConfig = await bootstrapResponse.json();
        
        const gistRawUrl = bootstrapConfig.gistRawUrl;

        if (gistRawUrl && typeof gistRawUrl === 'string' && gistRawUrl.trim() !== '') {
          const urlWithCommitRemoved = gistRawUrl.replace(/\/raw\/[a-f0-9]{40}\//, '/raw/');
          
          const url = new URL(urlWithCommitRemoved);
          url.searchParams.set('_', new Date().getTime().toString());
          const mainResponse = await fetch(url.toString(), { cache: 'reload' });

          if (mainResponse.ok) {
            const liveConfig = await mainResponse.json();
            if (typeof liveConfig === 'object' && liveConfig !== null && liveConfig.siteName) {
              setConfig(liveConfig);
              setLoading(false);
              return; // Success: Loaded from Gist.
            } else {
               throw new Error('Invalid config from Gist.');
            }
          }
        }
        // Throw to trigger fallbacks if Gist isn't available or fetch failed
        throw new Error("Gist not configured or fetch failed.");

      } catch (networkError) {
        console.warn("Network fetch failed, trying fallbacks.", networkError);

        // Priority 2: Try to load from localStorage cache.
        try {
          const cachedConfigJSON = localStorage.getItem(CONFIG_STORAGE_KEY);
          if (cachedConfigJSON) {
            const parsedConfig = JSON.parse(cachedConfigJSON);
            if (parsedConfig && parsedConfig.siteName) {
              setInternalConfig(parsedConfig); // Use internal setter to avoid re-caching stale data
              setLoading(false);
              return; // Success: Loaded from cache.
            }
          }
        } catch (e) {
          console.warn("Cached config is invalid.", e);
          localStorage.removeItem(CONFIG_STORAGE_KEY);
        }

        // Priority 3: Fallback to local bootstrap file.
        try {
            const bootstrapResponse = await fetch('/config.json');
            if (bootstrapResponse.ok) {
                const bootstrapConfig = await bootstrapResponse.json();
                setConfig(bootstrapConfig); // Cache this for offline use next time
                setLoading(false);
                return;
            }
            throw new Error("Local config fetch failed.");
        } catch (e) {
            // Priority 4: All methods failed.
            console.error("All config loading methods failed.", e);
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            setError(message);
            setLoading(false);
        }
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

    const gistRawUrlFromStorage = localStorage.getItem('gistRawUrl');
    const githubToken = localStorage.getItem('githubToken');

    if (!gistRawUrlFromStorage || !githubToken) {
        throw new Error("لم يتم تكوين المزامنة. يرجى إدخال رابط Gist Raw و GitHub Token في إعدادات المزامنة.");
    }

    const gistUrlForApi = gistRawUrlFromStorage.replace(/\/raw\/[a-f0-9]{40}\//, '/raw/');
    
    const match = gistUrlForApi.match(/https:\/\/gist\.githubusercontent\.com\/[^\/]+\/([a-fA-F0-9]+)\/raw\/(.*)$/);

    if (!match) {
        throw new Error("رابط Gist Raw غير صالح. تأكد من أنه بالتنسيق الصحيح وأنه لا يحتوي على رمز commit hash.");
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