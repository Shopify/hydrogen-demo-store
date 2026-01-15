import type {Config} from '@react-router/dev/config';
import {hydrogenPreset} from '@shopify/hydrogen/react-router-preset';

/**
 * React Router configuration for Hydrogen's recommended preset.
 * The preset enables SSR optimizations that align with Oxygen deployment.
 */
export default {
  presets: [hydrogenPreset()],
} satisfies Config;
