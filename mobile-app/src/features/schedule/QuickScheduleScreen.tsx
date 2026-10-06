import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/tokens';
import { MobileVisit } from '../dashboard/dashboard_utils';
import { DashboardTopHeader } from '../dashboard/DashboardTopHeader';
import { ScheduledVisitSection } from '../dashboard/ScheduledVisitSection';

export interface QuickScheduleScreenProps {
  onNavigateBooking?: () => void;
  onNavigateHome?: () => void;
  initialVisit?: MobileVisit | null;
  onToast?: (message: string) => void;
  onCancelVisit?: (visitId: string) => void | Promise<void>;
}

export const QuickScheduleScreen: React.FC<QuickScheduleScreenProps> = ({
  onNavigateBooking,
  initialVisit,
  onToast,
  onCancelVisit,
}) => {
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = useState<MobileVisit | null>(initialVisit ?? null);
  const [isLoadingVisit, setIsLoadingVisit] = useState(initialVisit === undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadUpcomingVisit() {
      if (initialVisit !== undefined) {
        setIsLoadingVisit(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;
        if (!currentUserId || !isMounted) {
          setIsLoadingVisit(false);
          return;
        }

        const { data: dbAppointment } = await supabase
          .from('appointments')
          .select(`
            id,
            starts_at,
            status,
            pet:pets(name),
            master:masters(display_name),
            service:services!appointments_service_id_fkey(name)
          `)
          .eq('client_id', currentUserId)
          .neq('status', 'cancelled')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (isMounted) {
          if (dbAppointment) {
            const masterRecord = Array.isArray(dbAppointment.master)
              ? dbAppointment.master[0]
              : dbAppointment.master;
            const serviceRecord = Array.isArray(dbAppointment.service)
              ? dbAppointment.service[0]
              : dbAppointment.service;
            const petRecord = Array.isArray(dbAppointment.pet)
              ? dbAppointment.pet[0]
              : dbAppointment.pet;

            setVisit({
              id: dbAppointment.id,
              startsAt: dbAppointment.starts_at,
              status: dbAppointment.status || 'confirmed',
              masterName: masterRecord?.display_name || 'Марія Шевченко',
              serviceName: serviceRecord?.name || 'Комплексний грумінг',
              petName: petRecord?.name,
            });
          } else {
            setVisit(null);
          }
        }
      } catch {
        if (isMounted) {
          setVisit(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVisit(false);
        }
      }
    }

    loadUpcomingVisit();

    return () => {
      isMounted = false;
    };
  }, [initialVisit]);

  const handleCancelVisit = async () => {
    if (!visit) return;

    try {
      if (onCancelVisit) {
        await onCancelVisit(visit.id);
      } else {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', visit.id);
      }
      setVisit(null);
      if (onToast) {
        onToast('Візит скасовано');
      } else {
        Alert.alert('Успіх', 'Візит скасовано');
      }
    } catch {
      Alert.alert('Помилка', 'Не вдалося скасувати візит');
    }
  };

  return (
    <View style={styles.container} testID="quick-schedule-screen">
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 70,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DashboardTopHeader />

        <ScheduledVisitSection
          visit={visit}
          isLoading={isLoadingVisit}
          onReschedule={onNavigateBooking}
          onCancel={handleCancelVisit}
          onBook={onNavigateBooking}
        />

        <View style={styles.bannerCard} testID="quick-schedule-banner">
          <Image
            source={require('../../../assets/images/dog_towel_shampoo.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(20, 20, 19, 0.05)', 'rgba(20, 20, 19, 0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerTextContainer}>
            <Text
              style={styles.bannerHeadingText}
              testID="quick-schedule-banner-text"
            >
              Заплануйте{'\n'}свій візит
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.quickBookButton}
          onPress={onNavigateBooking}
          accessibilityRole="button"
          accessibilityLabel="Швидкий запис"
          testID="quick-book-button"
        >
          <Text style={styles.quickBookButtonText}>Швидкий запис</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bannerCard: {
    borderRadius: 16,
    height: 230,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#161615',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bannerHeadingText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFBF6',
    lineHeight: 36,
  },
  quickBookButton: {
    backgroundColor: colors.terracotta,
    height: 48,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookButtonText: {
    color: '#FFFBF6',
    fontSize: 16,
    fontWeight: '600',
  },
});
