import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import { LoadingScreen } from './src/features/loading/LoadingScreen';
import { LandingScreen } from './src/features/landing/LandingScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { RegisterScreen } from './src/features/auth/RegisterScreen';
import { PetOnboardingScreen } from './src/features/pets/PetOnboardingScreen';
import { MainScreen } from './src/features/dashboard/MainScreen';
import { colors } from './src/theme/tokens';

export type ScreenState =
  | 'loading'
  | 'landing'
  | 'login'
  | 'register'
  | 'pet_onboarding'
  | 'authenticated';

export interface AppProps {
  initialScreen?: ScreenState;
  skipSessionCheck?: boolean;
}

export default function App({
  initialScreen,
  skipSessionCheck = false,
}: AppProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(
    initialScreen || 'loading'
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (initialScreen) {
      setCurrentScreen(initialScreen);
      return;
    }

    if (skipSessionCheck) {
      setCurrentScreen('landing');
      return;
    }

    let isMounted = true;

    async function checkAuthSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (data?.session?.user) {
          setUserEmail(data.session.user.email ?? null);
          setCurrentScreen('authenticated');
        } else {
          setTimeout(() => {
            if (isMounted) {
              setCurrentScreen('landing');
            }
          }, 800);
        }
      } catch {
        if (isMounted) {
          setCurrentScreen('landing');
        }
      }
    }

    checkAuthSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        setCurrentScreen('authenticated');
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [initialScreen, skipSessionCheck]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('landing');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container} testID="app-root">
        <StatusBar style="light" />

        {currentScreen === 'loading' && (
          <LoadingScreen onFinish={() => setCurrentScreen('landing')} />
        )}

        {currentScreen === 'landing' && (
          <LandingScreen
            onRegisterClick={() => setCurrentScreen('register')}
            onLoginClick={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onBack={() => setCurrentScreen('landing')}
            onSuccess={() => setCurrentScreen('authenticated')}
            onNavigateRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onBack={() => setCurrentScreen('landing')}
            onSuccess={() => setCurrentScreen('pet_onboarding')}
            onNavigateLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'pet_onboarding' && (
          <PetOnboardingScreen
            onBack={() => setCurrentScreen('authenticated')}
            onSuccess={() => setCurrentScreen('authenticated')}
            onSkip={() => setCurrentScreen('authenticated')}
          />
        )}

        {currentScreen === 'authenticated' && (
          <MainScreen
            userEmail={userEmail}
            onLogout={handleLogout}
            onNavigateAddPet={() => setCurrentScreen('pet_onboarding')}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
});
