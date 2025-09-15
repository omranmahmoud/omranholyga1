import React from 'react';
import { View, Text } from 'react-native';
import i18n from '../i18n';

type ErrorBoundaryProps = { children: React.ReactNode };
type State = { hasError: boolean; error?: any; info?: any };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Log full error and component stack
    console.error('ErrorBoundary caught:', error?.message || error, error?.stack);
    console.error('Component stack:', info?.componentStack);
    // Log props of ErrorBoundary and its children for debugging
    try {
      // Print ErrorBoundary props
      console.log('ErrorBoundary props:', this.props);
      // Print children props if possible
      if (React.Children.count(this.props.children) === 1) {
        const child = React.Children.only(this.props.children);
        if (React.isValidElement(child)) {
          console.log('ErrorBoundary child props:', child.props);
        }
      }
    } catch (e) {
      console.warn('ErrorBoundary debug logging failed:', e);
    }
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>{i18n.t('common.errorMessage', 'Something went wrong.')}</Text>
          <Text selectable>{String(this.state.error?.message || this.state.error || '')}</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;
