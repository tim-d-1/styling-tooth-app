import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

export interface BookingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export const BookingProgressBar: React.FC<BookingProgressBarProps> = ({
  currentStep,
  totalSteps = 5,
}) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
      testID="booking-progress-bar"
    >
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => {
        const isActive = stepNumber <= currentStep;
        return (
          <View
            key={stepNumber}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
            testID={`progress-dot-${stepNumber}`}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.terracotta,
  },
  dotInactive: {
    backgroundColor: colors.visitGray,
  },
});
