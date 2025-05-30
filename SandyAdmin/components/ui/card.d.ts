import { FC } from 'react';
import { ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: FC<CardProps>; 