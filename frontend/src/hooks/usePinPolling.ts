'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Pin, ProcessingStatus } from '@/lib/types/pin';
import { createClientPinsApi } from '@/lib/api/pins';

interface UsePinPollingOptions {
  onComplete?: (pin: Pin) => void;
  onFailed?: (pin: Pin) => void;
  pollingInterval?: number;
}

export function usePinPolling(
  pinId: string,
  options: UsePinPollingOptions = {}
) {
  const { onComplete, onFailed, pollingInterval = 2000 } = options;
  const { getToken, isLoaded } = useAuth();

  const [pin, setPin] = useState<Pin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPin = useCallback(async () => {
    if (!isLoaded) {
      return null;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const pinsApi = createClientPinsApi(token);
      const data = await pinsApi.get(pinId);
      setPin(data);
      setError(null);

      if (data.processing_status === 'complete' && onComplete) {
        onComplete(data);
      } else if (data.processing_status === 'failed' && onFailed) {
        onFailed(data);
      }

      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to fetch pin:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pinId, getToken, isLoaded, onComplete, onFailed]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const startPolling = async () => {
      const data = await fetchPin();

      if (!isMounted || !data) return;

      const isTerminalState =
        data.processing_status === 'complete' ||
        data.processing_status === 'failed';

      if (!isTerminalState) {
        intervalId = setInterval(async () => {
          const updatedData = await fetchPin();
          if (!updatedData) return;

          const isNowTerminal =
            updatedData.processing_status === 'complete' ||
            updatedData.processing_status === 'failed';

          if (isNowTerminal && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }, pollingInterval);
      }
    };

    startPolling().catch(err => {
      console.error('Polling error:', err);
    });

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pinId, pollingInterval, fetchPin, isLoaded]);

  const status: ProcessingStatus | null = pin?.processing_status || null;
  const isProcessing = status === 'processing' || status === 'pending';
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';

  return {
    pin,
    isLoading,
    error,
    status,
    isProcessing,
    isComplete,
    isFailed,
    refetch: fetchPin,
  };
}
