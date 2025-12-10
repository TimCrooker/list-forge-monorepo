import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Bot } from 'lucide-react-native';

export default function TypingIndicator() {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dotOpacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1Opacity, 0);
    animate(dot2Opacity, 200);
    animate(dot3Opacity, 400);
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View className="flex-row mb-4 justify-start">
      {/* Avatar */}
      <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-2">
        <Bot color="#0ea5e9" size={18} />
      </View>

      {/* Typing Bubble */}
      <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <View className="flex-row items-center gap-1">
          <Animated.View
            style={{ opacity: dot1Opacity }}
            className="w-2 h-2 rounded-full bg-gray-500"
          />
          <Animated.View
            style={{ opacity: dot2Opacity }}
            className="w-2 h-2 rounded-full bg-gray-500"
          />
          <Animated.View
            style={{ opacity: dot3Opacity }}
            className="w-2 h-2 rounded-full bg-gray-500"
          />
        </View>
      </View>
    </View>
  );
}
