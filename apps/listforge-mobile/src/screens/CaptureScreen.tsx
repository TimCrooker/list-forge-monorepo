import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, Save, Zap } from 'lucide-react-native';
import CameraView from '../components/capture/CameraView';
import PhotoStrip from '../components/capture/PhotoStrip';
import SyncStatusBadge from '../components/capture/SyncStatusBadge';
import { useCapture } from '../hooks/useCapture';
import { useBarcodeSearchMutation } from '../services/api';

export default function CaptureScreen() {
  const navigation = useNavigation();
  const [showCamera, setShowCamera] = useState(false);
  const [barcodeSearch] = useBarcodeSearchMutation();
  const {
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
  } = useCapture();

  const handlePhotoTaken = (uri: string) => {
    addPhoto(uri);
    setShowCamera(false);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const result = await barcodeSearch({ barcode }).unwrap();

      // Auto-fill title and description from barcode lookup
      if (result.title) {
        setTitle(result.title);
      }
      if (result.description) {
        setDescription(result.description);
      }

      Alert.alert('Product Found', `${result.title || barcode}`, [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      // Continue capturing even if lookup fails
    }
  };

  const handleSave = async () => {
    const success = await saveCapture();
    if (success) {
      // Could navigate away or show success message
    }
  };

  if (showCamera) {
    return (
      <CameraView
        onPhotoTaken={handlePhotoTaken}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900">Capture</Text>
            <SyncStatusBadge />
          </View>
          <Text className="text-gray-600">
            Take photos to create a new listing
          </Text>

          {/* Quick Eval Button */}
          <TouchableOpacity
            className="mt-3 bg-yellow-50 border border-yellow-200 py-3 px-4 rounded-lg flex-row items-center"
            onPress={() => navigation.navigate('QuickEval' as never)}
          >
            <Zap color="#eab308" size={20} />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-900 font-semibold">Quick Eval</Text>
              <Text className="text-yellow-700 text-xs">
                Get instant pricing without saving
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Photo Strip */}
          <View className="mt-4">
            <PhotoStrip photos={photos} onDeletePhoto={deletePhoto} />
          </View>

          {/* Camera Button */}
          <View className="px-4 mt-4">
            <TouchableOpacity
              className="bg-primary-600 py-4 rounded-lg flex-row items-center justify-center"
              onPress={() => setShowCamera(true)}
            >
              <Camera color="white" size={24} />
              <Text className="text-white font-semibold text-lg ml-2">
                {photos.length === 0 ? 'Take Photo' : 'Add Another Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional Fields */}
          <View className="px-4 mt-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="e.g., Vintage Nike Sneakers"
              value={title}
              onChangeText={setTitle}
              multiline={false}
            />

            <Text className="text-sm font-medium text-gray-700 mt-4 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Brief notes about condition, color, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text className="text-xs text-gray-500 mt-2">
              AI will automatically generate a detailed listing from your photos
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        {photos.length > 0 && (
          <View className="px-4 py-4 border-t border-gray-200 bg-white">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-4 rounded-lg items-center justify-center"
                onPress={reset}
                disabled={isSaving}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-primary-600 py-4 rounded-lg flex-row items-center justify-center"
                onPress={handleSave}
                disabled={isSaving}
              >
                <Save color="white" size={20} />
                <Text className="text-white font-semibold ml-2">
                  {isSaving ? 'Saving...' : 'Save Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

