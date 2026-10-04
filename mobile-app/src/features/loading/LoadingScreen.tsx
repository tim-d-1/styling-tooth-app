import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

export interface LoadingScreenProps {
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  return (
    <View style={styles.container} testID="loading-screen">
      <View style={styles.content}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Логотип Стильний Зубець"
        />
        <Text style={styles.title}>
          СТИЛЬНИЙ{'\n'}ЗУБЕЦЬ
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.terracotta,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 32,
    textTransform: 'uppercase',
  },
});

export default LoadingScreen;
