import 'react-native-gesture-handler';
// Polyfill Intl.PluralRules for i18next pluralization (some RN runtimes lack full Intl)
import 'intl-pluralrules';
// Temporarily skip top-level Reanimated init to avoid native crash; components that need it guard dynamically
// import 'react-native-reanimated';
// Ensure native-screens are enabled for native-stack
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { enableScreens } = require('react-native-screens');
	if (typeof enableScreens === 'function') enableScreens(true);
} catch {}
import { registerRootComponent } from 'expo';
import App from './App';

// Global error handler to surface full stacks in Metro
try {
	if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
		const prev = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
		global.ErrorUtils.setGlobalHandler((err, isFatal) => {
			try {
				// eslint-disable-next-line no-console
				console.error('GlobalError:', err?.message || err, '\nStack:', err?.stack, '\nFatal:', isFatal);
			} catch {}
			if (typeof prev === 'function') {
				try { prev(err, isFatal); } catch {}
			}
		});
	}
} catch {}

registerRootComponent(App);
