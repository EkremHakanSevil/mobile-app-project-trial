import { Text, View } from 'react-native';
import { Card, Screen, Subtitle, Title } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';

// Henüz yazılmamış modüller için yer tutucu: ne geleceğini listeler.
export function ComingSoon({ title, intro, items }: { title: string; intro: string; items: string[] }) {
  return (
    <Screen>
      <Title>{title}</Title>
      <Subtitle>{intro}</Subtitle>
      <Card>
        <View style={{ gap: spacing.sm }}>
          {items.map((i) => (
            <Text key={i} style={{ color: colors.text, fontSize: 15 }}>
              • {i}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
