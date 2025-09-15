import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import ProductCard, { Product } from './ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_CONTENT_WIDTH, getContainerWidth } from '../utils/layout';

type Props = { title: string; products: Product[]; wrap?: boolean; paging?: boolean; autoRotateCards?: boolean };

export default function ProductRail({ title, products, wrap = false, paging = false, autoRotateCards = true }: Props) {
  if (!products?.length) return null;
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const containerWidth = getContainerWidth(width, MAX_CONTENT_WIDTH);
  // Compute a responsive card width for horizontal rails (roughly 2.2 cards viewport)
  const cardWidth = useMemo(() => {
    const target = Math.round(containerWidth * 0.42);
    return Math.max(140, Math.min(target, 220));
  }, [containerWidth]);
  // For wrap mode, compute columns (2 on small, 3 on large width)
  const wrapCardWidth = useMemo(() => {
    if (!wrap) return cardWidth;
    if (containerWidth < 540) return Math.floor((containerWidth - 12 * 2 - 12) / 2); // 2 cols
    return Math.floor((containerWidth - 12 * 2 - 24) / 3); // 3 cols
  }, [wrap, containerWidth, cardWidth]);

  const spacing = 12;

  const content = wrap ? (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing,
        width: containerWidth,
        alignSelf: 'center',
        paddingLeft: 12 + insets.left,
        paddingRight: 12 + insets.right,
        justifyContent: 'flex-start',
      }}
    >
      {products.map((p, idx) => (
        <ProductCard
          key={p._id}
          product={p}
          width={wrapCardWidth}
          noRightMargin
          autoRotate={autoRotateCards}
        />
      ))}
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled={paging}
      decelerationRate={paging ? 'fast' : 'normal'}
      snapToInterval={paging ? cardWidth + spacing : undefined}
      snapToAlignment={paging ? 'start' : undefined}
      disableIntervalMomentum={paging}
      contentContainerStyle={[
        styles.row,
        {
          width: paging ? undefined : containerWidth,
          alignSelf: 'center',
          paddingLeft: 12 + insets.left,
          paddingRight: 12 + insets.right,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      {products.map((p, i) => (
        <View key={p._id} style={{ width: cardWidth, marginRight: paging ? spacing : 0 }}>
          <ProductCard product={p} width={cardWidth} noRightMargin autoRotate={autoRotateCards && !paging} />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.header,
          {
            width: containerWidth,
            alignSelf: 'center',
            alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
            },
          ]}
        >
          {t(title) || title}
        </Text>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  header: { paddingHorizontal: 12, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  row: { paddingHorizontal: 12 },
});
