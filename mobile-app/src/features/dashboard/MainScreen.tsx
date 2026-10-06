import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/tokens';
import {
  formatVisitDateDetails,
  formatVisitStatusText,
  MobileVisit,
} from './dashboard_utils';
import {
  HomeIcon,
  CalendarIcon,
  PawIcon,
  UserIcon,
  BellIcon,
  MarkerIcon,
} from '../../components/icons/AuthIcons';
import { ProfileScreen } from '../profile/ProfileScreen';
import { PersonalDataScreen } from '../profile/PersonalDataScreen';
import { MyAddressesScreen } from '../profile/MyAddressesScreen';
import { UserAddress } from '../profile/profile_types';
import { MyPetScreen } from '../pets/MyPetScreen';
import { BookingScreen } from '../booking/BookingScreen';
import {
  PetDetail,
  PetSwitcherItem,
  CareScheduleItem,
  PetProcedureHistory,
} from '../pets/pet_types';

export type DashboardTab = 'home' | 'booking' | 'pets' | 'profile';

export interface MainScreenProps {
  onLogout?: () => void;
  onNavigateBooking?: (petId?: string) => void;
  onNavigateAddPet?: () => void;
  userEmail?: string | null;
  initialVisit?: MobileVisit | null;
  initialTab?: DashboardTab;
  initialProfileSubScreen?: 'main' | 'personal_data' | 'addresses';
  initialPets?: PetSwitcherItem[];
  initialPetDetail?: PetDetail | null;
  initialSchedule?: CareScheduleItem[];
  initialHistory?: PetProcedureHistory | null;
  initialAddress?: Partial<UserAddress>;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  onLogout,
  onNavigateBooking,
  onNavigateAddPet,
  userEmail,
  initialVisit,
  initialTab,
  initialProfileSubScreen,
  initialPets,
  initialPetDetail,
  initialSchedule,
  initialHistory,
  initialAddress,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'home');
  const [profileSubScreen, setProfileSubScreen] = useState<
    'main' | 'personal_data' | 'addresses'
  >(initialProfileSubScreen || 'main');
  const [visit, setVisit] = useState<MobileVisit | null>(initialVisit ?? null);
  const [isLoadingVisit, setIsLoadingVisit] = useState(initialVisit === undefined);
  const [userName, setUserName] = useState('');
  const [pets, setPets] = useState<Array<{ id: string; name: string; species: string }>>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;
        if (!currentUserId || !isMounted) {
          setIsLoadingVisit(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUserId)
          .maybeSingle();

        if (isMounted && profile?.full_name) {
          setUserName(profile.full_name);
        }

        const { data: petList } = await supabase
          .from('pets')
          .select('id, name, species')
          .eq('owner_id', currentUserId);

        if (isMounted && petList) {
          setPets(petList);
        }

        if (initialVisit === undefined) {
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select(`
              id,
              starts_at,
              status,
              price,
              pet:pets(name, species),
              service:services!appointments_service_id_fkey(name),
              master:masters(display_name)
            `)
            .eq('client_id', currentUserId)
            .neq('status', 'cancelled')
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            if (appointmentData) {
              const petObj = Array.isArray(appointmentData.pet)
                ? appointmentData.pet[0]
                : appointmentData.pet;
              const srvObj = Array.isArray(appointmentData.service)
                ? appointmentData.service[0]
                : appointmentData.service;
              const mstrObj = Array.isArray(appointmentData.master)
                ? appointmentData.master[0]
                : appointmentData.master;

              setVisit({
                id: appointmentData.id,
                startsAt: appointmentData.starts_at,
                status: appointmentData.status,
                petName: petObj?.name || 'Улюбленець',
                serviceName: srvObj?.name || 'Комплексний грумінг',
                masterName: mstrObj?.display_name || 'Марія Шевченко',
                price: appointmentData.price,
              });
            } else {
              setVisit(null);
            }
          }
        }
      } catch {
        if (isMounted && initialVisit === undefined) {
          setVisit(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVisit(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [initialVisit]);

  const handleCancelVisit = async () => {
    if (!visit?.id) return;
    try {
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', visit.id);
      setVisit(null);
    } catch {
      Alert.alert('Помилка', 'Не вдалося скасувати візит');
    }
  };

  const visitDateDetails = visit ? formatVisitDateDetails(visit.startsAt) : null;
  const handleBookingNavigation = () => {
    if (onNavigateBooking) {
      onNavigateBooking();
    } else {
      setActiveTab('booking');
    }
  };

  return (
    <View style={styles.safeArea} testID="main-screen">
      {activeTab === 'pets' ? (
        <View style={styles.petsTabContainer} testID="pets-tab-container">
          <MyPetScreen
            onNavigateAddPet={onNavigateAddPet}
            onNavigateBooking={onNavigateBooking}
            initialPets={initialPets}
            initialPetDetail={initialPetDetail}
            initialSchedule={initialSchedule}
            initialHistory={initialHistory}
          />
        </View>
      ) : activeTab === 'booking' ? (
        <View
          style={[
            styles.petsTabContainer,
            { paddingBottom: Math.max(insets.bottom, 10) + 54 },
          ]}
          testID="booking-tab-content"
        >
          <BookingScreen
            onBack={() => setActiveTab('home')}
            onComplete={() => setActiveTab('home')}
            onNavigateAddPet={onNavigateAddPet}
            bottomInset={8}
          />
        </View>
      ) : activeTab === 'profile' ? (
        <View style={styles.petsTabContainer} testID="profile-tab-wrapper">
          {profileSubScreen === 'personal_data' ? (
            <PersonalDataScreen
              onBack={() => setProfileSubScreen('main')}
            />
          ) : profileSubScreen === 'addresses' ? (
            <MyAddressesScreen
              onBack={() => setProfileSubScreen('main')}
              initialAddress={initialAddress}
            />
          ) : (
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
              <ProfileScreen
                userEmail={userEmail}
                onLogout={onLogout}
                onNavigateBooking={onNavigateBooking}
                onNavigateAddPet={onNavigateAddPet}
                onPersonalInfoPress={() => setProfileSubScreen('personal_data')}
                onAddressesPress={() => setProfileSubScreen('addresses')}
              />
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 20) + 70,
            },
          ]}
        >
          <View style={styles.topHeader}>
            <View style={styles.locationContainer} testID="location-indicator">
              <MarkerIcon color={colors.terracotta} size={18} />
              <Text style={styles.locationText}>м. Київ</Text>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              accessibilityRole="button"
              accessibilityLabel="Сповіщення"
              testID="notifications-button"
            >
              <BellIcon color={colors.contentPrimary} size={20} />
            </TouchableOpacity>
          </View>

        {activeTab === 'home' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Запланований візит</Text>
            </View>

            {isLoadingVisit ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.terracotta} />
              </View>
            ) : visit && visitDateDetails ? (
              <View testID="visit-card-container">
                <View style={styles.visitCard} testID="visit-card">
                  <View style={styles.dateBadge} testID="visit-date-badge">
                    <Text style={styles.dayOfWeekText}>
                      {visitDateDetails.dayOfWeek}
                    </Text>
                    <Text style={styles.dayNumberText}>
                      {visitDateDetails.dayNumber}
                    </Text>
                    <View style={styles.dateDividerLine} />
                    <Text style={styles.timeText}>{visitDateDetails.time}</Text>
                  </View>

                  <View style={styles.nestedInfoCard}>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Майстер:</Text>
                      <Text style={styles.infoValue}>
                        {visit.masterName || 'Марія Шевченко'}
                      </Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Процедура:</Text>
                      <Text style={styles.infoValue}>
                        {visit.serviceName || 'Комплексний грумінг'}
                      </Text>
                    </View>
                    {visit.petName && (
                      <View style={styles.infoField}>
                        <Text style={styles.petNameText}>
                          Тваринка: {visit.petName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.visitActionsRow}>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={handleBookingNavigation}
                    accessibilityRole="button"
                    accessibilityLabel="Перенести візит"
                    testID="reschedule-visit-button"
                  >
                    <Text style={styles.actionButtonPrimaryText}>
                      Перенести
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButtonSecondary}
                    onPress={handleCancelVisit}
                    accessibilityRole="button"
                    accessibilityLabel="Скасувати візит"
                    testID="cancel-visit-button"
                  >
                    <Text style={styles.actionButtonSecondaryText}>
                      Скасувати
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyVisitCard} testID="empty-visit-card">
                <Text style={styles.emptyVisitTitle}>
                  Немає запланованих візитів
                </Text>
                <Text style={styles.emptyVisitSubtitle}>
                  Запишіть свого улюбленця на зручний час
                </Text>
                <TouchableOpacity
                  style={styles.emptyBookButton}
                  onPress={handleBookingNavigation}
                  testID="empty-book-button"
                >
                  <Text style={styles.emptyBookButtonText}>
                    Записати улюбленця
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoScrollContent}
              style={styles.promoScrollView}
            >
              <View style={styles.promoBannerCard} testID="promo-discount-card">
                <Image
                  source={require('../../../assets/images/promo_grooming_tools.png')}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.promoBannerContent}>
                  <View>
                    <Text style={styles.promoLabel}>НА ПЕРШИЙ ГРУМІНГ</Text>
                    <Text style={styles.promoBigDiscount}>-25%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.promoDetailButton}
                    onPress={handleBookingNavigation}
                    testID="promo-detail-button"
                    accessibilityRole="button"
                    accessibilityLabel="Знижка 25% на перший грумінг: Детальніше"
                  >
                    <Text style={styles.promoDetailText}>Детальніше</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.promoBannerCard}
                onPress={handleBookingNavigation}
                activeOpacity={0.9}
                testID="promo-seasonal-card"
                accessibilityRole="button"
                accessibilityLabel="Безкоштовне підстригання кігтів при комплексному грумінгу"
              >
                <Image
                  source={require('../../../assets/images/promo_nail_trimming.png')}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.85)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.promoBannerContent, { justifyContent: 'flex-end' }]}>
                  <Text style={styles.promoHighlightText}>Безкоштовне</Text>
                  <Text style={styles.promoSubText}>
                    підстригання кігтів при комплексному грумінгу
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.promoBannerCard, styles.promoWeekdayCard]}
                onPress={handleBookingNavigation}
                activeOpacity={0.9}
                testID="promo-weekday-card"
                accessibilityRole="button"
                accessibilityLabel="-20% на комплексний грумінг у будні"
              >
                <LinearGradient
                  colors={['#ECEEF1', '#D1DCEE']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <Image
                  source={require('../../../assets/images/promo_weekday_grooming-701240.png')}
                  style={styles.bannerWeekdayImage}
                  resizeMode="contain"
                />
                <View style={[styles.promoBannerContent, { justifyContent: 'center' }]}>
                  <Text style={styles.promoWeekdayPercent}>-20%</Text>
                  <Text style={styles.promoWeekdayText}>
                    на комплексний грумінг у будні
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Поради експертів</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adviceScrollContent}
              style={styles.adviceScrollView}
            >
              <TouchableOpacity
                style={[styles.adviceCard, { backgroundColor: '#E6F0F6' }]}
                onPress={handleBookingNavigation}
                activeOpacity={0.9}
                testID="advice-card-shampoo"
              >
                <Image
                  source={require('../../../assets/images/golden_retriever_bath.png')}
                  style={styles.adviceImageRight}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['#E6F0F6', 'rgba(230, 240, 246, 0.85)', 'rgba(230, 240, 246, 0)']}
                  start={{ x: 0.35, y: 0.5 }}
                  end={{ x: 0.55, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                  testID="advice-shampoo-gradient"
                />
                <View style={styles.adviceTextContainer}>
                  <Text style={styles.adviceCardTitleDark}>
                    ЯК ОБРАТИ{'\n'}ПРАВИЛЬНИЙ{'\n'}ШАМПУНЬ?
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adviceCard, { backgroundColor: '#D8E5F3' }]}
                onPress={handleBookingNavigation}
                activeOpacity={0.9}
                testID="advice-card-paws"
              >
                <Image
                  source={require('../../../assets/images/expert_advice_paws_bg.png')}
                  style={styles.adviceBgImage}
                  resizeMode="cover"
                />
                <Image
                  source={require('../../../assets/images/dog_paw_close_up.png')}
                  style={styles.adviceImageRight}
                  resizeMode="cover"
                />
                <View style={styles.adviceTextContainer}>
                  <Text style={styles.adviceCardTitleAccent}>5 ПОРАД</Text>
                  <Text style={styles.adviceCardSubtitle} numberOfLines={1}>
                    для здорових лап
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}
      </ScrollView>
    )}

      <View
        style={[
          styles.tabbar,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
        testID="bottom-tabbar"
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
          accessibilityRole="button"
          accessibilityLabel="Головна"
          testID="tab-home"
        >
          <HomeIcon
            color={
              activeTab === 'home' ? colors.terracotta : colors.textMuted
            }
            size={22}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.tabLabelActive,
            ]}
          >
            Головна
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('booking')}
          accessibilityRole="button"
          accessibilityLabel="Запис"
          testID="tab-booking"
        >
          <CalendarIcon
            color={
              activeTab === 'booking' ? colors.terracotta : colors.textMuted
            }
            size={22}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'booking' && styles.tabLabelActive,
            ]}
          >
            Запис
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('pets')}
          accessibilityRole="button"
          accessibilityLabel="Улюбленці"
          testID="tab-pets"
        >
          <PawIcon
            color={
              activeTab === 'pets' ? colors.terracotta : colors.textMuted
            }
            size={22}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'pets' && styles.tabLabelActive,
            ]}
          >
            Улюбленці
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          accessibilityRole="button"
          accessibilityLabel="Профіль"
          testID="tab-profile"
        >
          <UserIcon
            color={
              activeTab === 'profile' ? colors.terracotta : colors.textMuted
            }
            size={22}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'profile' && styles.tabLabelActive,
            ]}
          >
            Профіль
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  petsTabContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.contentPrimary,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  visitCard: {
    backgroundColor: '#ECEEF1',
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 11,
  },
  dateBadge: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayOfWeekText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#242F35',
    textTransform: 'uppercase',
  },
  dayNumberText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#242F35',
    lineHeight: 50,
  },
  dateDividerLine: {
    width: 54,
    height: 1,
    backgroundColor: '#FFFBF6',
    marginVertical: 4,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#242F35',
  },
  nestedInfoCard: {
    flex: 1,
    backgroundColor: '#FFFBF6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  infoField: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#242F35',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#242F35',
  },
  petNameText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  visitActionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBF6',
  },
  actionButtonSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242F35',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242F35',
  },
  emptyVisitCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF1',
    gap: 8,
  },
  emptyVisitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  emptyVisitSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyBookButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.terracotta,
  },
  emptyBookButtonText: {
    color: colors.surfaceCream,
    fontSize: 13,
    fontWeight: '600',
  },
  promoScrollView: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  promoScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  promoBannerCard: {
    width: 280,
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
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
  promoBannerContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  promoBigDiscount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    marginTop: 2,
  },
  promoDetailButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.terracotta,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  promoDetailText: {
    color: colors.surfaceCream,
    fontSize: 13,
    fontWeight: '600',
  },
  promoHighlightText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.terracotta,
    marginBottom: 4,
  },
  promoSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  promoWeekdayCard: {
    backgroundColor: '#ECEEF1',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  bannerWeekdayImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    width: 145,
  },
  promoWeekdayPercent: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.terracotta,
    marginBottom: 2,
    lineHeight: 38,
  },
  promoWeekdayText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentPrimary,
    lineHeight: 20,
    maxWidth: 130,
  },
  adviceScrollView: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  adviceScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  adviceCard: {
    width: 280,
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  adviceBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  adviceImageRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    width: 170,
  },
  adviceTextContainer: {
    paddingLeft: 18,
    paddingRight: 8,
    paddingTop: 22,
    maxWidth: 220,
    zIndex: 10,
  },
  adviceCardTitleDark: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.contentPrimary,
    lineHeight: 23,
  },
  adviceCardTitleAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  adviceCardSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContentContainer: {
    paddingVertical: 12,
    gap: 16,
  },
  tabHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.contentPrimary,
    marginBottom: 8,
  },
  petItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceWhite,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEEF1',
  },
  petIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(236, 100, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petItemInfo: {
    flex: 1,
  },
  petItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  petItemSpecies: {
    fontSize: 13,
    color: colors.textMuted,
  },
  noPetsText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  addPetButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addPetButtonText: {
    color: colors.terracotta,
    fontSize: 15,
    fontWeight: '600',
  },
  bookingPrimaryButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  bookingPrimaryButtonText: {
    color: colors.surfaceCream,
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: colors.surfaceWhite,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    gap: 4,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  profileEmailText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  logoutButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: colors.surfaceCream,
    fontSize: 15,
    fontWeight: '600',
  },
  tabbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surfaceWhite,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF1',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.terracotta,
    fontWeight: '600',
  },
});

export default MainScreen;
