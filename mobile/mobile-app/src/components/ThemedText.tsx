import React from 'react';
import { Text, TextProps } from 'react-native';
import i18n from '../i18n';
import { getFontFamily } from '../theme/fonts';
import { getVariantStyle, TypographyVariant } from '../theme/typography';

export interface ThemedTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  variant?: TypographyVariant;
  children?: React.ReactNode;
}

const ThemedText: React.FC<ThemedTextProps> = ({ weight = 'regular', variant, style, children, ...rest }) => {
  const lang = i18n.language;
  const variantStyle = variant ? getVariantStyle(variant) : null;
  return (
    <Text
      {...rest}
      style={[{ fontFamily: getFontFamily(weight, lang) }, variantStyle, style]}
      allowFontScaling
    >
      {children}
    </Text>
  );
};

export default ThemedText;
