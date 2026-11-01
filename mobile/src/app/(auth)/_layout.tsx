import { Stack } from 'expo-router/stack';
import { colors } from '@/lib/theme';

export const unstable_settings = { anchor: 'sign-in' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
