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
import {
  BellIcon,
  UserIcon,
  AngleSmallRightIcon,
  CommentUserIcon,
  CreditCardIcon,
  BellRingIcon,
  CommentsIcon,
  InterrogationIcon,
  LockIcon,
  MarkerIcon,
} from '../../components/icons/AuthIcons';
import { ProfileUser, ProfileSettingItem } from './profile_types';
import {
  resolveProfileUserName,
  resolveGreeting,
  formatProfilePhone,
  resolvePaymentSubtitle,
  formatBonusPoints,
} from './profile_utils';
import { resolveLoyaltyTier, calculateCashbackPoints } from './loyalty';

export interface ProfileScreenProps {
  onLogout?: () => void;
  onNotificationPress?: () => void;
  onPersonalInfoPress?: () => void;
  onAddressesPress?: () => void;
  onPaymentMethodsPress?: () => void;
  onNotificationsSettingsPress?: () => void;
  onSupportPress?: () => void;
  onFaqPress?: () => void;
  onPrivacyPolicyPress?: () => void;
  onLoyaltyPress?: () => void;
  onNavigateBooking?: () => void;
  onNavigateAddPet?: () => void;
  initialUser?: ProfileUser;
  userEmail?: string | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onNotificationPress,
  onPersonalInfoPress,
  onAddressesPress,
  onPaymentMethodsPress,
  onNotificationsSettingsPress,
  onSupportPress,
  onFaqPress,
  onPrivacyPolicyPress,
  onLoyaltyPress,
  initialUser,
  userEmail,
}) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<ProfileUser>(
    initialUser || {
      name: '',
      phone: '',
      email: userEmail || '',
      avatarUrl: null,
      loyaltyTier: 'Bronze Level • 10% Cashback',
      bonusPoints: 0,
    }
  );
  const [paymentSubtitle, setPaymentSubtitle] = useState('Банківська картка');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        const currentUserId = sessionUser?.id;

        if (!currentUserId || !isMounted) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        if (!isMounted) return;

        const resolvedName = resolveProfileUserName(profileData, sessionUser);
        const resolvedPhone =
          profileData?.phone?.trim() ||
          sessionUser?.phone ||
          sessionUser?.user_metadata?.phone ||
          '';

        const rawAvatar =
          profileData?.avatar_url ||
          sessionUser?.user_metadata?.avatar_url ||
          sessionUser?.user_metadata?.picture ||
          null;

        const resolvedAvatar =
          rawAvatar &&
          typeof rawAvatar === 'string' &&
          rawAvatar.trim() &&
          rawAvatar.trim() !== 'null' &&
          rawAvatar.trim() !== 'undefined'
            ? rawAvatar.trim()
            : null;

        const discountPct = profileData?.discount_pct
          ? Number(profileData.discount_pct)
          : 0;

        const methods = sessionUser?.user_metadata?.payment_methods;
        const resolvedPaySubtitle = resolvePaymentSubtitle(methods);
        setPaymentSubtitle(resolvedPaySubtitle);

        const { data: dbCompleted } = await supabase
          .from('appointments')
          .select('id, price')
          .eq('client_id', currentUserId)
          .eq('status', 'completed');

        if (!isMounted) return;

        const lifetimeSpend = Array.isArray(dbCompleted)
          ? dbCompleted.reduce(
              (sum: number, item: any) => sum + (Number(item.price) || 0),
              0
            )
          : 0;

        const tier = resolveLoyaltyTier(lifetimeSpend, discountPct);
        const calculatedPoints = calculateCashbackPoints(
          lifetimeSpend,
          tier.cashbackRatePct
        );

        setUser((prev) => ({
          ...prev,
          name: resolvedName || prev.name,
          phone: resolvedPhone || prev.phone,
          email: profileData?.email || sessionUser?.email || prev.email,
          avatarUrl: resolvedAvatar || prev.avatarUrl,
          loyaltyTier: tier.name,
          bonusPoints: calculatedPoints,
        }));
      } catch {
      }
    }

    if (!initialUser) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      Alert.alert('Сповіщення', 'Немає нових сповіщень');
    }
  };

  const handleLoyaltyPress = () => {
    if (onLoyaltyPress) {
      onLoyaltyPress();
    } else {
      Alert.alert(
        'Програма лояльності',
        `${user.loyaltyTier}\nБаланс: ${formatBonusPoints(user.bonusPoints)} бонусів`
      );
    }
  };

  const handleSettingPress = (settingId: string) => {
    switch (settingId) {
      case 'personal_info':
        if (onPersonalInfoPress) onPersonalInfoPress();
        else Alert.alert('Особисті дані', user.name || 'Особисті дані');
        break;
      case 'addresses':
        if (onAddressesPress) onAddressesPress();
        else Alert.alert('Мої адреси', 'Дім, Офіс');
        break;
      case 'payment_methods':
        if (onPaymentMethodsPress) onPaymentMethodsPress();
        else Alert.alert('Способи оплати', paymentSubtitle);
        break;
      case 'notifications':
        if (onNotificationsSettingsPress) onNotificationsSettingsPress();
        else Alert.alert('Сповіщення', 'Налаштування сповіщень');
        break;
      case 'support':
        if (onSupportPress) onSupportPress();
        else Alert.alert('Підтримка', 'Служба підтримки онлайн');
        break;
      case 'faq':
        if (onFaqPress) onFaqPress();
        else Alert.alert('FAQ', 'Часті запитання');
        break;
      case 'privacy_policy':
        if (onPrivacyPolicyPress) onPrivacyPolicyPress();
        else Alert.alert('Конфіденційність', 'Політика конфіденційності');
        break;
    }
  };

  const settingsItems: ProfileSettingItem[] = [
    {
      id: 'personal_info',
      title: 'Особисті дані',
      subtitle: "Ім'я, телефон, email",
      iconName: 'comment-user',
    },
    {
      id: 'addresses',
      title: 'Мої адреси',
      subtitle: 'Дім, Офіс',
      iconName: 'map-marker',
    },
    {
      id: 'payment_methods',
      title: 'Способи оплати',
      subtitle: paymentSubtitle,
      iconName: 'credit-card',
    },
    {
      id: 'notifications',
      title: 'Налаштування сповіщень',
      iconName: 'bell-ring',
    },
  ];

  const helpItems: ProfileSettingItem[] = [
    {
      id: 'support',
      title: 'Підтримка',
      subtitle: 'Online',
      iconName: 'comments',
      isOnline: true,
    },
    {
      id: 'faq',
      title: 'Часті запитання (FAQ)',
      iconName: 'interrogation',
    },
    {
      id: 'privacy_policy',
      title: 'Політика конфіденційності',
      iconName: 'lock',
    },
  ];

  const renderIcon = (name: ProfileSettingItem['iconName']) => {
    switch (name) {
      case 'comment-user':
        return <CommentUserIcon color={colors.terracotta} size={20} />;
      case 'map-marker':
        return <MarkerIcon color={colors.terracotta} size={20} />;
      case 'credit-card':
        return <CreditCardIcon color={colors.terracotta} size={20} />;
      case 'bell-ring':
        return <BellRingIcon color={colors.terracotta} size={20} />;
      case 'comments':
        return <CommentsIcon color={colors.terracotta} size={20} />;
      case 'interrogation':
        return <InterrogationIcon color={colors.terracotta} size={20} />;
      case 'lock':
        return <LockIcon color={colors.terracotta} size={20} />;
      default:
        return null;
    }
  };

  const greetingText = resolveGreeting(user.name);

  return (
    <View style={styles.container} testID="profile-tab-content">
      <View style={styles.headerRow} testID="profile-header">
        <Text style={styles.greetingText} testID="profile-greeting-text">
          {greetingText}
        </Text>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Сповіщення"
          testID="profile-notifications-button"
        >
          <BellIcon color={colors.contentPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.userCardWrapper} testID="profile-user-card">
        <LinearGradient
          colors={['#242F35', '#3C474C']}
          start={{ x: 0.38, y: 0.39 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCardGradient}
        >
          <View style={styles.userInfoRow}>
            <View style={styles.avatarBorder}>
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  testID="profile-avatar-image"
                />
              ) : (
                <View style={styles.avatarFallback} testID="profile-default-avatar">
                  <UserIcon color={colors.surfaceWhite} size={30} />
                </View>
              )}
            </View>

            <View style={styles.userDetailsCol}>
              <Text style={styles.userNameText} testID="profile-user-name">
                {user.name || 'Користувач'}
              </Text>
              <Text style={styles.userPhoneText} testID="profile-user-phone">
                {formatProfilePhone(user.phone)}
              </Text>
            </View>
          </View>

          <View testID="profile-loyalty-section">
            <TouchableOpacity
              style={styles.loyaltySection}
              onPress={handleLoyaltyPress}
              activeOpacity={0.9}
              testID="loyalty-card-button"
              accessibilityRole="button"
              accessibilityLabel={`Рівень лояльності: ${user.loyaltyTier}, бонусів: ${user.bonusPoints}`}
            >
              <View style={styles.loyaltyLeftCol}>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText} testID="profile-loyalty-tier">
                    {user.loyaltyTier || 'Bronze Level • 10% Cashback'}
                  </Text>
                </View>

                <View style={styles.pointsRow}>
                  <Text style={styles.pointsNumberText} testID="profile-bonus-points">
                    {formatBonusPoints(user.bonusPoints)}
                  </Text>
                  <Text style={styles.pointsLabelText}>бонусів</Text>
                </View>
              </View>

              <AngleSmallRightIcon color={colors.surfaceWhite} size={24} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} testID="heading-profile">
          Профіль
        </Text>
      </View>

      <View style={styles.settingsGroup}>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingCard}
            onPress={() => handleSettingPress(item.id)}
            activeOpacity={0.8}
            testID={`setting-item-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.iconCircle}>
              {renderIcon(item.iconName)}
            </View>

            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitleText}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.settingSubtitleText}>{item.subtitle}</Text>
              ) : null}
            </View>

            <AngleSmallRightIcon color={colors.textMuted} size={20} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} testID="heading-help">
          Допомога та інфо
        </Text>
      </View>

      <View style={styles.settingsGroup}>
        {helpItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingCard}
            onPress={() => handleSettingPress(item.id)}
            activeOpacity={0.8}
            testID={`setting-item-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.iconCircle}>
              {renderIcon(item.iconName)}
              {item.isOnline && (
                <View
                  style={styles.onlineBadge}
                  testID="support-online-badge"
                />
              )}
            </View>

            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitleText}>{item.title}</Text>
              {item.subtitle ? (
                <Text
                  style={[
                    styles.settingSubtitleText,
                    item.isOnline && styles.onlineSubtitleText,
                  ]}
                >
                  {item.subtitle}
                </Text>
              ) : null}
            </View>

            <AngleSmallRightIcon color={colors.textMuted} size={20} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel="Вийти з акаунту"
        testID="logout-button"
      >
        <Text style={styles.logoutButtonText}>Вийти з акаунту</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.contentDark,
    flex: 1,
    marginRight: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 16,
  },
  userCardGradient: {
    padding: 20,
    borderRadius: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.contentDark,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#303B42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.surfaceWhite,
  },
  userPhoneText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  loyaltySection: {
    backgroundColor: colors.softBlue,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  loyaltyLeftCol: {
    flex: 1,
  },
  tierBadge: {
    backgroundColor: colors.terracotta,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tierBadgeText: {
    fontSize: 12,
    color: colors.surfaceWhite,
    fontWeight: '500',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsNumberText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.surfaceWhite,
  },
  pointsLabelText: {
    fontSize: 14,
    color: colors.surfaceWhite,
  },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.contentDark,
  },
  settingsGroup: {
    gap: 12,
    marginBottom: 8,
  },
  settingCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.statusSuccess,
    borderWidth: 1.5,
    borderColor: colors.surfaceWhite,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  settingTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  settingTitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.contentDark,
  },
  settingSubtitleText: {
    fontSize: 11,
    color: 'rgba(36, 47, 53, 0.7)',
    marginTop: 2,
  },
  onlineSubtitleText: {
    color: colors.statusSuccess,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.statusError,
  },
});

export default ProfileScreen;
