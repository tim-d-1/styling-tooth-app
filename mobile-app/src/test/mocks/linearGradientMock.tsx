import React from 'react';
import { View, ViewProps } from 'react-native';

export interface LinearGradientProps extends ViewProps {
  colors: readonly string[];
  locations?: readonly number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  children,
  style,
  testID = 'linear-gradient-mock',
  ...rest
}) => {
  return (
    <View style={style} testID={testID} {...rest}>
      {children}
    </View>
  );
};

export default LinearGradient;
