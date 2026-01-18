'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '@/lib/types/collection';
import { createClientCollectionsApi } from '@/lib/api/collections';

export function useCollections() {
  const { getToken } = useAuth();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const api = createClientCollectionsApi(token);
      const data = await api.list();
      setCollections(data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to fetch collections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(async (payload: CreateCollectionRequest) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    const api = createClientCollectionsApi(token);
    const created = await api.create(payload);
    setCollections((prev) => [created, ...prev]);
    return created;
  }, [getToken]);

  const updateCollection = useCallback(async (id: string, payload: UpdateCollectionRequest) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    const api = createClientCollectionsApi(token);
    const updated = await api.update(id, payload);
    setCollections((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [getToken]);

  const deleteCollection = useCallback(async (id: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    const api = createClientCollectionsApi(token);
    await api.delete(id);
    setCollections((prev) => prev.filter((item) => item.id !== id));
  }, [getToken]);

  return {
    collections,
    isLoading,
    error,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  };
}
