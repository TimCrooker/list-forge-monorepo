import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { captureException } from '../config/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and displays a friendly error screen.
 * Automatically reports errors to Sentry.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    captureException(error, {
      errorInfo: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 px-6 py-8 items-center justify-center">
            <AlertTriangle color="#ef4444" size={64} />

            <Text className="text-2xl font-bold text-gray-900 mt-6 text-center">
              Something went wrong
            </Text>

            <Text className="text-gray-600 text-center mt-2 px-4">
              We've been notified and are looking into it.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView className="mt-6 w-full bg-gray-100 p-4 rounded-lg max-h-64">
                <Text className="text-xs font-mono text-red-600">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-xs font-mono text-gray-700 mt-2">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              className="mt-8 bg-primary-600 py-4 px-8 rounded-lg flex-row items-center"
              onPress={this.handleReset}
            >
              <RefreshCw color="white" size={20} />
              <Text className="text-white font-semibold ml-2 text-lg">
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
