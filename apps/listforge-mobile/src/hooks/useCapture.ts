import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDispatch } from 'react-redux';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { setPendingCount } from '../store/slices/syncSlice';
import { MAX_PHOTOS_PER_ITEM } from '../constants';

interface Photo {
  id: string;
  uri: string;
  order: number;
}

export function useCapture() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  const addPhoto = useCallback(async (uri: string) => {
    if (photos.length >= MAX_PHOTOS_PER_ITEM) {
      Alert.alert('Limit Reached', `Maximum ${MAX_PHOTOS_PER_ITEM} photos per item`);
      return;
    }

    try {
      // Process image - compress and convert to WebP format
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 2048 } }], // Max width 2048px
        { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
      );

      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const newPhoto: Photo = {
        id: photoId,
        uri: manipResult.uri,
        order: photos.length,
      };

      setPhotos((prev) => [...prev, newPhoto]);
    } catch (error) {
      console.error('Failed to process photo:', error);
      Alert.alert('Error', 'Failed to process photo');
    }
  }, [photos]);

  const deletePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== photoId);
      // Reorder remaining photos
      return filtered.map((photo, index) => ({
        ...photo,
        order: index,
      }));
    });
  }, []);

  const saveCapture = useCallback(async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please take at least one photo');
      return false;
    }

    setIsSaving(true);

    try {
      const captureId = `capture-${Date.now()}`;

      // Create capture in database
      await db.createCapture({
        id: captureId,
        title: title || undefined,
        description: description || undefined,
        created_at: Date.now(),
      });

      // Add photos to database
      for (const photo of photos) {
        await db.addPhoto({
          id: photo.id,
          capture_id: captureId,
          uri: photo.uri, // Photo is already processed and stored by ImageManipulator
          order_index: photo.order,
          upload_status: 'pending',
        });
      }

      // Update pending count
      const stats = await db.getStorageStats();
      dispatch(setPendingCount(stats.captureCount));

      // Trigger sync
      syncService.syncAll();

      // Reset form
      setPhotos([]);
      setTitle('');
      setDescription('');

      Alert.alert('Success', 'Item saved! Syncing in background...');
      return true;
    } catch (error) {
      console.error('Failed to save capture:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [photos, title, description, dispatch]);

  const reset = useCallback(() => {
    setPhotos([]);
    setTitle('');
    setDescription('');
  }, []);

  return {
    photos,
    title,
    setTitle,
    description,
    setDescription,
    isSaving,
    addPhoto,
    deletePhoto,
    saveCapture,
    reset,
  };
}
