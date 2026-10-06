import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
import { MarkerIcon, BellIcon } from '../../components/icons/AuthIcons';

export interface DashboardTopHeaderProps {
  locationText?: string;
  onNotificationsPress?: () => void;
}

export const DashboardTopHeader: React.FC<DashboardTopHeaderProps> = ({
  locationText = 'м. Київ',
  onNotificationsPress,
}) => {
  return (
    <View style={styles.topHeader}>
      <View style={styles.locationContainer} testID="location-indicator">
        <MarkerIcon color={colors.terracotta} size={18} />
        <Text style={styles.locationText}>{locationText}</Text>
      </View>

      <TouchableOpacity
        style={styles.bellButton}
        onPress={onNotificationsPress}
        accessibilityRole="button"
        accessibilityLabel="Сповіщення"
        testID="notifications-button"
      >
        <BellIcon color={colors.contentPrimary} size={20} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
