import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { useLoginMutation } from '../services/api';
import { setCredentials } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const result = await login({ email, password }).unwrap();

      // Store credentials securely
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, result.token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, result.userId);

      // Update Redux state
      dispatch(setCredentials(result));
    } catch (error: any) {
      Alert.alert('Login Failed', error?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-8">ListForge</Text>

      <View className="w-full space-y-4">
        <TextInput
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-4"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="w-full bg-primary-600 rounded-lg py-3 mt-6"
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
