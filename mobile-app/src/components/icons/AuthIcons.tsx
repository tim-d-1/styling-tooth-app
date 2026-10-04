import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ArrowLeftIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#242F35',
  size = 20,
}) => (
  <View style={[styles.center, { width: size, height: size }]} accessibilityLabel="Назад">
    <Text style={{ fontSize: size * 0.9, color, fontWeight: '700', lineHeight: size }}>
      ←
    </Text>
  </View>
);

export const EyeIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#242F35',
  size = 20,
}) => (
  <View style={[styles.center, { width: size, height: size }]} accessibilityLabel="Показати пароль">
    <Text style={{ fontSize: size * 0.75, color }}>👁</Text>
  </View>
);

export const EyeOffIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#B2B2B2',
  size = 20,
}) => (
  <View style={[styles.center, { width: size, height: size }]} accessibilityLabel="Приховати пароль">
    <Text style={{ fontSize: size * 0.75, color }}>🙈</Text>
  </View>
);

export const GoogleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <View style={[styles.center, { width: size, height: size }]} accessibilityLabel="Google">
    <Text style={{ fontSize: size * 0.8, fontWeight: '700', color: '#4285F4' }}>G</Text>
  </View>
);

export const AppleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <View style={[styles.center, { width: size, height: size }]} accessibilityLabel="Apple">
    <Text style={{ fontSize: size * 0.9, fontWeight: '700', color: '#000000' }}></Text>
  </View>
);

export const GlobeIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#B2B2B2',
  size = 14,
}) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <Text style={{ fontSize: size * 0.9, color }}>🌐</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
