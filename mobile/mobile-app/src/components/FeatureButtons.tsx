import React from 'react';
import { View, StyleSheet } from 'react-native';

// FeatureButtons component was showing free shipping & flash sale; now removed per request.
// Keeping a lightweight spacer container so layout in HomeScreen doesn't break.
const FeatureButtons = () => {
  return <View style={styles.spacer} />;
};

const styles = StyleSheet.create({
  spacer: {
    height: 0, // no vertical space; adjust if you want to keep previous gap
    marginBottom: 0,
  },
});

export default FeatureButtons;
