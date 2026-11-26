import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { spacing } from '@/shared/theme/spacing';

type SectionHeaderProps = {
  title: string;
  kicker?: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, kicker, description, action }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {kicker ? <AppText variant="overline" color="accentText" weight="heavy">{kicker}</AppText> : null}
        <AppText variant="h3" weight="bold" accessibilityRole="header">{title}</AppText>
        {description ? <AppText variant="bodySmall" color="textSecondary">{description}</AppText> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  action: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
});
