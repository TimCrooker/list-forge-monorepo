import React from 'react';
import { Image, StyleSheet, Dimensions } from 'react-native';

interface PhotoPreviewProps {
  uri: string;
}

const { width, height } = Dimensions.get('window');

export default function PhotoPreview({ uri }: PhotoPreviewProps) {
  return (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width,
    height,
    backgroundColor: '#000',
  },
});
