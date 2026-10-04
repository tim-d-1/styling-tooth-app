import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../../theme/tokens';

export interface LandingScreenProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onRegisterClick,
  onLoginClick,
}) => {
  return (
    <View style={styles.container} testID="landing-screen">
      <Image
        source={require('../../../assets/images/landing-hero-dog.png')}
        style={styles.heroImage}
        resizeMode="cover"
        accessibilityLabel="Преміум грумінг для собак"
      />

      <LinearGradient
        colors={['transparent', 'rgba(8, 22, 33, 0.75)', colors.bannerDarkBlur]}
        locations={[0, 0.45, 1]}
        style={styles.bottomGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              ПРЕМІУМ{'\n'}ГРУМІНГ
            </Text>
            <Text style={styles.subtitle}>
              без черг і дзвінків
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={onRegisterClick}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Реєстрація"
            >
              <Text style={styles.registerButtonText}>Реєстрація</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={onLoginClick}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Увійти"
            >
              <Text style={styles.loginButtonText}>Увійти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bannerDarkBlur,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: SCREEN_HEIGHT * 0.75,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.55,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  textContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 48,
    lineHeight: 48,
    fontWeight: '700',
    color: colors.creamLight,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: colors.creamLight,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: colors.terracotta,
  },
  registerButtonText: {
    color: colors.surfaceCream,
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.surfaceCream,
  },
  loginButtonText: {
    color: colors.contentPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LandingScreen;
