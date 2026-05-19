import { type JSX, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type MascotVariant =
  | 'hero'
  | 'inviting'
  | 'curious'
  | 'celebrating'
  | 'triumphant'
  | 'resting'
  | 'sad'
  | 'silhouette';

export type MascotState = 'static' | 'idle';

export interface MascotProps {
  variant?: MascotVariant;
  size?: number;
  state?: MascotState;
  testID?: string;
}

// Only `hero` has a real asset today. Other variants share the hero source as a
// placeholder so screens can wire `<Mascot variant="celebrating" />` ahead of
// the assets landing — replace each entry below when its artwork ships.
const HERO_SOURCE: ImageSourcePropType = require('../../assets/mascot/hero.png');
const REAL_VARIANTS = new Set<MascotVariant>(['hero']);
const MASCOT_SOURCES: Record<MascotVariant, ImageSourcePropType> = {
  hero: HERO_SOURCE,
  inviting: HERO_SOURCE,
  curious: HERO_SOURCE,
  celebrating: HERO_SOURCE,
  triumphant: HERO_SOURCE,
  resting: HERO_SOURCE,
  sad: HERO_SOURCE,
  silhouette: HERO_SOURCE,
};

const warnedVariants = new Set<MascotVariant>();

export default function Mascot({
  variant = 'hero',
  size = 160,
  state = 'static',
  testID,
}: MascotProps): JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  // Shared values default to the static pose so the worklet starts from a
  // known baseline regardless of which state Mascot was mounted in.
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (state !== 'idle' || reducedMotion) {
      cancelAnimation(scale);
      cancelAnimation(rotate);
      scale.value = 1;
      rotate.value = 0;
      return;
    }

    // Slightly out-of-phase periods (2400ms vs 2800ms) prevent the visible
    // "lockstep" robotic feel of a single shared duration.
    scale.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1.5, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    return (): void => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, [state, reducedMotion, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  if (__DEV__ && !REAL_VARIANTS.has(variant) && !warnedVariants.has(variant)) {
    warnedVariants.add(variant);
    // eslint-disable-next-line no-console
    console.warn(`[Mascot] no asset for variant "${variant}" yet — falling back to hero.`);
  }

  return (
    <Animated.View style={animatedStyle} testID={testID}>
      <Image
        source={MASCOT_SOURCES[variant]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={t(`mascot.${variant}`)}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
