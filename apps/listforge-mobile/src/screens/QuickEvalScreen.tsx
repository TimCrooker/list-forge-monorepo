import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, X } from 'lucide-react-native';
import CameraView from '../components/capture/CameraView';
import PhotoPreview from '../components/capture/PhotoPreview';
import QuickEvalResults from '../components/capture/QuickEvalResults';
import { useQuickEvalMutation } from '../services/api';

type ScreenState = 'camera' | 'preview' | 'evaluating' | 'results';

export default function QuickEvalScreen() {
  const navigation = useNavigation();
  const [quickEval, { isLoading }] = useQuickEvalMutation();

  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<string | undefined>();

  const handlePhotoTaken = (uri: string) => {
    setCapturedPhoto(uri);
    setScreenState('preview');
  };

  const handleBarcodeDetected = (barcode: string) => {
    setDetectedBarcode(barcode);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setDetectedBarcode(undefined);
    setScreenState('camera');
  };

  const handleSubmitForEval = async () => {
    if (!capturedPhoto) return;

    try {
      setScreenState('evaluating');

      // Create FormData with the photo
      const formData = new FormData();
      formData.append('photos', {
        uri: capturedPhoto,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      if (detectedBarcode) {
        formData.append('barcode', detectedBarcode);
      }

      const result = await quickEval(formData).unwrap();
      setEvalResult(result);
      setScreenState('results');
    } catch (error) {
      console.error('Quick eval error:', error);
      Alert.alert(
        'Evaluation Failed',
        'Could not evaluate this item. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => setScreenState('preview'),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handlePass = () => {
    // Reset and go back to camera
    setCapturedPhoto(null);
    setEvalResult(null);
    setDetectedBarcode(undefined);
    setScreenState('camera');
  };

  const handleKeep = () => {
    // Navigate to full capture flow with the photo
    // TODO: Pass the photo and barcode to the regular capture screen
    // For now, just navigate to capture
    navigation.navigate('Capture' as never);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between bg-black">
        <Text className="text-white text-lg font-semibold">
          {screenState === 'camera' ? 'Quick Eval' :
           screenState === 'preview' ? 'Review Photo' :
           screenState === 'evaluating' ? 'Evaluating...' :
           'Results'}
        </Text>
        <TouchableOpacity onPress={handleClose}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Camera State */}
      {screenState === 'camera' && (
        <View className="flex-1">
          <CameraView
            onPhotoTaken={handlePhotoTaken}
            onBarcodeScanned={handleBarcodeDetected}
            onClose={handleClose}
          />

          {detectedBarcode && (
            <View className="absolute bottom-32 left-0 right-0 items-center">
              <View className="bg-green-500 px-4 py-2 rounded-full">
                <Text className="text-white font-semibold">
                  Barcode: {detectedBarcode}
                </Text>
              </View>
            </View>
          )}

          {/* Help text */}
          <View className="absolute bottom-20 left-0 right-0 items-center">
            <Text className="text-white text-center px-8">
              Snap a photo for quick evaluation
            </Text>
          </View>
        </View>
      )}

      {/* Preview State */}
      {screenState === 'preview' && capturedPhoto && (
        <View className="flex-1">
          <PhotoPreview uri={capturedPhoto} />

          {/* Action buttons */}
          <View className="absolute bottom-8 left-0 right-0 px-6 gap-3">
            <TouchableOpacity
              className="bg-primary-600 py-4 rounded-lg"
              onPress={handleSubmitForEval}
            >
              <Text className="text-white font-semibold text-center text-lg">
                Evaluate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-700 py-4 rounded-lg"
              onPress={handleRetakePhoto}
            >
              <Text className="text-white font-semibold text-center text-lg">
                Retake
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Evaluating State */}
      {screenState === 'evaluating' && (
        <View className="flex-1 bg-white items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="text-gray-600 mt-4 text-lg">
            Analyzing item...
          </Text>
          <Text className="text-gray-500 mt-2 text-center px-8">
            This usually takes 5-15 seconds
          </Text>
        </View>
      )}

      {/* Results State */}
      {screenState === 'results' && evalResult && (
        <QuickEvalResults
          result={evalResult}
          onPass={handlePass}
          onKeep={handleKeep}
        />
      )}
    </SafeAreaView>
  );
}
