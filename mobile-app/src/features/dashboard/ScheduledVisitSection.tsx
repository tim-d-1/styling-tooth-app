import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/tokens';
import {
  formatVisitDateDetails,
  MobileVisit,
} from './dashboard_utils';

export interface ScheduledVisitSectionProps {
  visit: MobileVisit | null;
  isLoading?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBook?: () => void;
}

export const ScheduledVisitSection: React.FC<ScheduledVisitSectionProps> = ({
  visit,
  isLoading = false,
  onReschedule,
  onCancel,
  onBook,
}) => {
  const visitDateDetails = visit ? formatVisitDateDetails(visit.startsAt) : null;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} testID="schedule-heading">
          Запланований візит
        </Text>
      </View>

      {isLoading ? (
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

            <View style={styles.nestedInfoCard} testID="nested-info-card">
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
              onPress={onReschedule}
              accessibilityRole="button"
              accessibilityLabel="Перенести візит"
              testID="reschedule-visit-button"
            >
              <Text style={styles.actionButtonPrimaryText}>Перенести</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Скасувати візит"
              testID="cancel-visit-button"
            >
              <Text style={styles.actionButtonSecondaryText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyVisitCard} testID="empty-visit-card">
          <Text style={styles.emptyVisitTitle}>Немає запланованих візитів</Text>
          <Text style={styles.emptyVisitSubtitle}>
            Запишіть свого улюбленця на зручний час
          </Text>
          <TouchableOpacity
            style={styles.emptyBookButton}
            onPress={onBook}
            testID="empty-book-button"
          >
            <Text style={styles.emptyBookButtonText}>Записати улюбленця</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
});
