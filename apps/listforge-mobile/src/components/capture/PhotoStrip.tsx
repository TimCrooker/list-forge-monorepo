import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { X } from 'lucide-react-native';

interface Photo {
  id: string;
  uri: string;
  order: number;
}

interface PhotoStripProps {
  photos: Photo[];
  onDeletePhoto: (photoId: string) => void;
  onReorderPhotos?: (photos: Photo[]) => void;
}

export default function PhotoStrip({ photos, onDeletePhoto }: PhotoStripProps) {
  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeletePhoto(photoId),
        },
      ]
    );
  };

  if (photos.length === 0) {
    return (
      <View className="h-24 bg-gray-100 items-center justify-center">
        <Text className="text-gray-500">No photos yet</Text>
      </View>
    );
  }

  return (
    <View className="h-24 bg-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-2"
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {photos.map((photo, index) => (
          <View key={photo.id} className="mr-2 relative">
            {/* Order badge */}
            <View className="absolute top-1 left-1 bg-black/70 w-6 h-6 rounded-full items-center justify-center z-10">
              <Text className="text-white text-xs font-bold">
                {index + 1}
              </Text>
            </View>

            {/* Delete button */}
            <TouchableOpacity
              className="absolute top-1 right-1 bg-red-500 w-6 h-6 rounded-full items-center justify-center z-10"
              onPress={() => handleDeletePhoto(photo.id)}
            >
              <X color="white" size={14} />
            </TouchableOpacity>

            {/* Photo thumbnail */}
            <Image
              source={{ uri: photo.uri }}
              className="w-20 h-20 rounded-lg bg-gray-300"
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
