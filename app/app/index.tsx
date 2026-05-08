import type { JSX } from 'react';
import { Text, View } from 'react-native';

export default function Index(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Text className="text-fg1">Daily Challenges</Text>
    </View>
  );
}
