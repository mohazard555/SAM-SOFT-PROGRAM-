
import { useCallback } from 'react';

const STORAGE_KEY = 'downloadCounts';

type DownloadCounts = {
  [programId: string]: number;
};

const getCounts = (): DownloadCounts => {
  try {
    const counts = localStorage.getItem(STORAGE_KEY);
    return counts ? JSON.parse(counts) : {};
  } catch (error) {
    console.error('Error parsing download counts from localStorage:', error);
    return {};
  }
};

const saveCounts = (counts: DownloadCounts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch (error) {
    console.error('Error saving download counts to localStorage:', error);
  }
};

export const useDownloads = () => {
  const getDownloadCount = useCallback((programId: string): number => {
    const counts = getCounts();
    return counts[programId] || 0;
  }, []);

  const incrementDownloadCount = useCallback((programId: string) => {
    const counts = getCounts();
    counts[programId] = (counts[programId] || 0) + 1;
    saveCounts(counts);
  }, []);

  return { getDownloadCount, incrementDownloadCount };
};
