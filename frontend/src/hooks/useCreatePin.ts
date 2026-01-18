'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Pin, CreatePinRequest } from '@/lib/types/pin';
import { createClientPinsApi } from '@/lib/api/pins';

export function useCreatePin() {
  const { getToken } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [createdPin, setCreatedPin] = useState<Pin | null>(null);

  const createPin = useCallback(async (data: CreatePinRequest): Promise<Pin | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const pinsApi = createClientPinsApi(token);
      const pin = await pinsApi.create(data);
      setCreatedPin(pin);
      return pin;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to create pin:', error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [getToken]);

  const reset = useCallback(() => {
    setCreatedPin(null);
    setError(null);
    setIsCreating(false);
  }, []);

  return {
    createPin,
    isCreating,
    error,
    createdPin,
    reset,
  };
}
