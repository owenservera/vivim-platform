import type { ButtonHTMLAttributes } from 'react';

export type { ButtonVariant, ButtonSize } from './Button';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: import('./Button').ButtonVariant;
  size?: import('./Button').ButtonSize;
  isLoading?: boolean;
}
