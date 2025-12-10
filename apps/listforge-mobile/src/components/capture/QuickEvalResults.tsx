import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, DollarSign, Package, Clock, AlertTriangle } from 'lucide-react-native';

interface QuickEvalResultsProps {
  result: any;
  onPass: () => void;
  onKeep: () => void;
}

export default function QuickEvalResults({ result, onPass, onKeep }: QuickEvalResultsProps) {
  if (!result.success) {
    return (
      <View className="flex-1 bg-white px-6 py-8">
        <View className="items-center">
          <AlertTriangle color="#ef4444" size={64} />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Evaluation Failed
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            {result.warnings?.[0] || 'Could not evaluate this item'}
          </Text>
        </View>

        <TouchableOpacity
          className="mt-8 bg-gray-200 py-4 rounded-lg"
          onPress={onPass}
        >
          <Text className="text-gray-700 font-semibold text-center text-lg">
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { identifiedAs, pricing, demand, comparables, processingTimeMs } = result;
  const demandColor =
    demand?.level === 'high' ? 'text-green-600' :
    demand?.level === 'medium' ? 'text-yellow-600' :
    'text-red-600';

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Quick Evaluation
        </Text>
        <View className="flex-row items-center mt-2">
          <Clock color="#6b7280" size={16} />
          <Text className="text-sm text-gray-600 ml-1">
            {(processingTimeMs / 1000).toFixed(1)}s
          </Text>
        </View>
      </View>

      {/* Product Identification */}
      {identifiedAs && (
        <View className="px-6 py-6 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <Package color="#0ea5e9" size={24} />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Product
            </Text>
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2">
            {identifiedAs.title}
          </Text>

          {identifiedAs.brand && (
            <Text className="text-base text-gray-600 mb-1">
              Brand: {identifiedAs.brand}
            </Text>
          )}

          {identifiedAs.category && (
            <Text className="text-base text-gray-600 mb-1">
              Category: {identifiedAs.category}
            </Text>
          )}

          <View className="mt-3 bg-gray-100 px-3 py-2 rounded-lg self-start">
            <Text className="text-sm text-gray-700">
              {Math.round(identifiedAs.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      )}

      {/* Pricing */}
      {pricing && pricing.suggestedPrice > 0 && (
        <View className="px-6 py-6 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <DollarSign color="#059669" size={24} />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Pricing
            </Text>
          </View>

          <View className="flex-row items-baseline mb-2">
            <Text className="text-3xl font-bold text-green-600">
              ${pricing.suggestedPrice.toFixed(2)}
            </Text>
            <Text className="text-gray-500 ml-2">suggested</Text>
          </View>

          <Text className="text-base text-gray-600">
            Range: ${pricing.priceRangeLow.toFixed(2)} - ${pricing.priceRangeHigh.toFixed(2)}
          </Text>

          <View className="mt-3 bg-gray-100 px-3 py-2 rounded-lg self-start">
            <Text className="text-sm text-gray-700">
              {Math.round(pricing.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      )}

      {/* Demand */}
      {demand && (
        <View className="px-6 py-6 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <TrendingUp color="#0ea5e9" size={24} />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Market Demand
            </Text>
          </View>

          <Text className={`text-2xl font-bold ${demandColor} capitalize mb-2`}>
            {demand.level}
          </Text>

          {demand.indicators && demand.indicators.length > 0 && (
            <View className="gap-1">
              {demand.indicators.map((indicator: string, index: number) => (
                <Text key={index} className="text-gray-600">
                  • {indicator}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Comparables Summary */}
      {comparables && comparables.count > 0 && (
        <View className="px-6 py-6 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Market Data
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Comparables found:</Text>
              <Text className="font-semibold text-gray-900">
                {comparables.count}
              </Text>
            </View>

            {comparables.averagePrice > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Average price:</Text>
                <Text className="font-semibold text-gray-900">
                  ${comparables.averagePrice.toFixed(2)}
                </Text>
              </View>
            )}

            {comparables.recentSales > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Recent sales:</Text>
                <Text className="font-semibold text-gray-900">
                  {comparables.recentSales}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <View className="px-6 py-4 bg-yellow-50">
          {result.warnings.map((warning: string, index: number) => (
            <View key={index} className="flex-row items-start mb-2">
              <AlertTriangle color="#f59e0b" size={16} />
              <Text className="text-sm text-yellow-800 ml-2 flex-1">
                {warning}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View className="px-6 py-6 gap-3">
        <TouchableOpacity
          className="bg-primary-600 py-4 rounded-lg"
          onPress={onKeep}
        >
          <Text className="text-white font-semibold text-center text-lg">
            Keep & Full Research
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 py-4 rounded-lg"
          onPress={onPass}
        >
          <Text className="text-gray-700 font-semibold text-center text-lg">
            Pass
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spacing at bottom */}
      <View className="h-8" />
    </ScrollView>
  );
}
