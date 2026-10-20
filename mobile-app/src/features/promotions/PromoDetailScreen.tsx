import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/tokens';
import { ArrowLeftIcon } from '../../components/icons/AuthIcons';
import {
  PROMOS_REGISTRY,
  DEFAULT_PROMO_ID,
  type PromoData,
} from './promo_types';

export interface PromoDetailScreenProps {
  promoId?: string | null;
  promo?: PromoData;
  onBack?: () => void;
  onBook?: () => void;
}

export const PromoDetailScreen: React.FC<PromoDetailScreenProps> = ({
  promoId,
  promo,
  onBack,
  onBook,
}) => {
  const insets = useSafeAreaInsets();
  const activePromo =
    promo ||
    (promoId && PROMOS_REGISTRY[promoId]) ||
    PROMOS_REGISTRY[DEFAULT_PROMO_ID];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="promo-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          testID="promo-detail-back-button"
          accessibilityRole="button"
          accessibilityLabel="Назад"
        >
          <ArrowLeftIcon color={colors.terracotta} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Спеціальна пропозиція
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.highlightCard}>
          <Text style={styles.highlightPrefix}>{activePromo.highlightPrefix}</Text>
          <Text style={styles.highlightTitle}>{activePromo.highlightTitle}</Text>
        </View>

        <Text style={styles.descriptionText}>{activePromo.description}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{activePromo.sectionTitle}</Text>
          {activePromo.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listBullet}>—</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={onBook}
          activeOpacity={0.9}
          testID="promo-quick-book-button"
          accessibilityRole="button"
          accessibilityLabel={activePromo.buttonText}
        >
          <Text style={styles.bookButtonText}>{activePromo.buttonText}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 100, 58, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  highlightCard: {
    backgroundColor: colors.visitGray,
    borderRadius: radii.md,
    padding: 20,
    marginBottom: 20,
  },
  highlightPrefix: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.terracotta,
    marginBottom: 6,
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentDark,
    lineHeight: 26,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.contentDark,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listBullet: {
    fontSize: 16,
    color: colors.terracotta,
    marginRight: 10,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: colors.contentDark,
    lineHeight: 22,
  },
  bookButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bookButtonText: {
    color: colors.surfaceWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PromoDetailScreen;
