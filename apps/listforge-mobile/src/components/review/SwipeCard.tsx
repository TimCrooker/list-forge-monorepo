import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ThumbsUp, ThumbsDown, DollarSign } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  item: any; // Item from API with AI-generated listing
  onSwipeLeft: (itemId: string) => void;
  onSwipeRight: (itemId: string) => void;
  isTopCard?: boolean;
}

export default function SwipeCard({
  item,
  onSwipeLeft,
  onSwipeRight,
  isTopCard = true,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ startX: 0, startY: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = {
        startX: translateX.value,
        startY: translateY.value,
      };
    })
    .onUpdate((event) => {
      translateX.value = context.value.startX + event.translationX;
      translateY.value = context.value.startY + event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe detected
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100,
          { velocity: event.velocityX },
          () => {
            if (direction === 'right') {
              runOnJS(onSwipeRight)(item.id);
            } else {
              runOnJS(onSwipeLeft)(item.id);
            }
          }
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: isTopCard ? opacity : 0.8,
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const primaryPhoto = item.media?.[0]?.url || item.photos?.[0];
  const title = item.aiGeneratedTitle || item.title || 'Untitled Item';
  const price = item.suggestedPrice || item.priceRangeLow;
  const confidence = item.aiConfidence || item.researchConfidence;

  return (
    <GestureDetector gesture={isTopCard ? panGesture : Gesture.Pan()}>
      <Animated.View
        style={[cardStyle]}
        className="absolute w-full h-full rounded-2xl bg-white shadow-xl overflow-hidden"
      >
        {/* Image */}
        {primaryPhoto && (
          <Image
            source={{ uri: primaryPhoto }}
            className="w-full h-96"
            resizeMode="cover"
          />
        )}

        {/* Swipe Indicators */}
        <Animated.View
          style={[likeOpacity]}
          className="absolute top-12 right-8 bg-green-500 px-4 py-2 rounded-full transform rotate-12"
        >
          <View className="flex-row items-center">
            <ThumbsUp color="white" size={24} />
            <Text className="text-white font-bold text-xl ml-2">APPROVE</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[nopeOpacity]}
          className="absolute top-12 left-8 bg-red-500 px-4 py-2 rounded-full transform -rotate-12"
        >
          <View className="flex-row items-center">
            <ThumbsDown color="white" size={24} />
            <Text className="text-white font-bold text-xl ml-2">REJECT</Text>
          </View>
        </Animated.View>

        {/* Content */}
        <View className="flex-1 p-6">
          {/* Confidence Badge */}
          {confidence && (
            <View
              className={`self-start px-3 py-1 rounded-full mb-3 ${
                confidence >= 0.8
                  ? 'bg-green-100'
                  : confidence >= 0.6
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  confidence >= 0.8
                    ? 'text-green-700'
                    : confidence >= 0.6
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}
              >
                {Math.round(confidence * 100)}% Confidence
              </Text>
            </View>
          )}

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </Text>

          {/* Price */}
          {price && (
            <View className="flex-row items-center mb-4">
              <DollarSign color="#059669" size={24} />
              <Text className="text-2xl font-bold text-green-600">
                {typeof price === 'number' ? price.toFixed(2) : price}
              </Text>
            </View>
          )}

          {/* Description */}
          {item.aiGeneratedDescription && (
            <Text className="text-gray-700 text-base leading-6" numberOfLines={4}>
              {item.aiGeneratedDescription}
            </Text>
          )}

          {/* Key Attributes */}
          {item.identifiedAttributes && item.identifiedAttributes.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Key Details:
              </Text>
              <View className="flex-row flex-wrap">
                {item.identifiedAttributes.slice(0, 5).map((attr: any) => (
                  <View
                    key={attr.key}
                    className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-sm text-gray-700">
                      {attr.label}: {attr.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Instructions */}
        {isTopCard && (
          <View className="absolute bottom-6 left-0 right-0 items-center">
            <Text className="text-gray-600 text-sm">
              Swipe left to reject • Swipe right to approve
            </Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
