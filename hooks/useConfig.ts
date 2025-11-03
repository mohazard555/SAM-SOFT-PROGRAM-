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
      setError(null);
      let loadedConfig: Config | null = null;
      
      // Attempt to load from cache for immediate UI rendering
      try {
        const cachedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (cachedConfig) {
          loadedConfig = JSON.parse(cachedConfig);
          setConfig(loadedConfig);
        }
      } catch (e) {
        console.error("Failed to parse cached config from localStorage", e);
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
      
      let bootstrapConfig: any = null;

      try {
        // First, try to fetch the local bootstrap config. Use an absolute path to be robust against routing changes.
        const bootstrapResponse = await fetch('/config.json');

        if (!bootstrapResponse.ok) {
            // If the local file itself is not found, this is a critical error unless we have a cache.
            throw new Error(`Could not load configuration file: ${bootstrapResponse.status}`);
        }
        
        bootstrapConfig = await bootstrapResponse.json();
        const gistRawUrl = bootstrapConfig.gistRawUrl;

        let liveConfig: Config;
        
        // If a valid Gist URL is provided, fetch the live config from there.
        if (gistRawUrl && typeof gistRawUrl === 'string' && gistRawUrl.trim() !== '') {
            try {
                // Gist URLs are absolute. Add cache-busting param.
                const url = new URL(gistRawUrl);
                url.searchParams.set('_', new Date().getTime().toString());
                
                const mainResponse = await fetch(url.toString());
                if (!mainResponse.ok) {
                    throw new Error(`Gist fetch failed with status ${mainResponse.status}`);
                }
                
                const gistData = await mainResponse.json();
                
                // Stricter validation to ensure the fetched data is a valid config object, not an empty array or other junk.
                if (typeof gistData === 'object' && gistData !== null && !Array.isArray(gistData) && gistData.siteName && gistData.admin && Array.isArray(gistData.categories)) {
                    liveConfig = gistData;
                } else {
                    throw new Error('Invalid or empty config received from Gist.');
                }
            } catch (gistError) {
                const message = gistError instanceof Error ? gistError.message : String(gistError);
                console.warn(`Could not load or parse config from Gist (${gistRawUrl}): ${message}. Falling back to local config.`);
                liveConfig = bootstrapConfig;
            }
        } else {
            // If no Gist URL, the bootstrap config is our main config.
            liveConfig = bootstrapConfig;
        }

        setConfig(liveConfig);
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(liveConfig));

      } catch (e) {
        console.error("Configuration loading failed.", e);
        // If any fetch fails and we don't have a cached config, show an error.
        if (!loadedConfig) {
             if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred');
            }
        }
        // If we have a cached config (`loadedConfig`), we'll just stick with that.
      } finally {
        setLoading(false);
      }
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
