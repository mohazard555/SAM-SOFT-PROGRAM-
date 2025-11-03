import { useState, useEffect, useCallback } from 'react';
import type { Config } from '../types';

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const gistRawUrl = localStorage.getItem('gistRawUrl');

      if (gistRawUrl) {
        try {
          // Append a timestamp to bypass cache
          const url = new URL(gistRawUrl);
          url.searchParams.set('_', new Date().getTime().toString());
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`Gist fetch error! status: ${response.status}`);
          }
          const data: Config = await response.json();
          setConfig(data);
          setLoading(false);
          return; // Exit if Gist fetch is successful
        } catch (e: unknown) {
          console.error("Failed to fetch from Gist, falling back to local config.", e);
          // Fallback to local config if Gist fetch fails
        }
      }

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