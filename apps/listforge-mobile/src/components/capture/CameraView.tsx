import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Camera, FlipHorizontal, X } from 'lucide-react-native';
import { BARCODE_COOLDOWN_MS } from '../../constants';

interface CameraViewComponentProps {
  onPhotoTaken: (uri: string) => void;
  onBarcodeScanned?: (barcode: string) => void;
  onClose: () => void;
}

export default function CameraViewComponent({
  onPhotoTaken,
  onBarcodeScanned,
  onClose
}: CameraViewComponentProps) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [lastBarcodeScanned, setLastBarcodeScanned] = useState<string | null>(null);
  const [lastBarcodeScanTime, setLastBarcodeScanTime] = useState(0);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScan = ({ data, type }: BarcodeScanningResult) => {
    const now = Date.now();

    // Debounce - prevent duplicate scans within cooldown period
    if (
      data === lastBarcodeScanned &&
      now - lastBarcodeScanTime < BARCODE_COOLDOWN_MS
    ) {
      return;
    }

    console.log(`Barcode detected: ${data} (${type})`);

    // Update last scan info
    setLastBarcodeScanned(data);
    setLastBarcodeScanTime(now);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Notify parent
    if (onBarcodeScanned) {
      onBarcodeScanned(data);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPhotoTaken(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-center text-lg mb-4">
          Camera permission is required to capture photos
        </Text>
        <TouchableOpacity
          className="bg-primary-600 px-6 py-3 rounded-lg"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: [
            'upc_a',
            'upc_e',
            'ean13',
            'ean8',
            'code128',
            'code39',
            'qr',
          ],
        }}
        onBarcodeScanned={onBarcodeScanned ? handleBarcodeScan : undefined}
      >
        {/* Top controls */}
        <View className="absolute top-0 left-0 right-0 pt-12 px-4">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              onPress={onClose}
            >
              <X color="white" size={24} />
            </TouchableOpacity>

            {onBarcodeScanned && (
              <View className="bg-black/70 px-4 py-2 rounded-full">
                <Text className="text-white text-sm">
                  Point at barcode to scan
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              onPress={toggleCameraFacing}
            >
              <FlipHorizontal color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barcode scan indicator */}
        {onBarcodeScanned && lastBarcodeScanned && (
          <View className="absolute top-32 left-0 right-0 items-center">
            <View className="bg-green-500 px-6 py-3 rounded-full">
              <Text className="text-white font-semibold">
                Scanned: {lastBarcodeScanned}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom controls */}
        <View className="absolute bottom-0 left-0 right-0 pb-12 items-center">
          <TouchableOpacity
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
            onPress={takePicture}
          >
            <View className="w-16 h-16 bg-white rounded-full" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
