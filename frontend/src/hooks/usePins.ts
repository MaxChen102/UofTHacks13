'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Pin } from '@/lib/types/pin';
import { createClientPinsApi } from '@/lib/api/pins';

export function usePins(collectionId?: string) {
  const { getToken, isLoaded } = useAuth();

  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPins = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const pinsApi = createClientPinsApi(token);
      const data = await pinsApi.list(collectionId);
      setPins(data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to fetch pins:', error);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, getToken, isLoaded]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  return {
    pins,
    isLoading,
    error,
    refetch: fetchPins,
  };
}
