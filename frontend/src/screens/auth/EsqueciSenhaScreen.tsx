import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/AuthScaffold';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'EsqueciSenha'>;
};

export function EsqueciSenhaScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleEnviar() {
    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await membrosService.esqueciSenha(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o e-mail.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
        <Icon name="chevron-back" size={22} color={colors.textSecondary} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Esqueci minha senha</Text>
        <Text style={styles.subtitle}>
          Informe o e-mail da sua conta — enviamos um link pra você escolher uma senha nova.
        </Text>
      </View>

      {enviado ? (
        <View style={styles.sucessoBox}>
          <Icon name="mail-outline" size={28} color={colors.primary} />
          <Text style={styles.sucessoTexto}>
            Se esse e-mail estiver cadastrado, você vai receber o link em instantes. Confira também
            a caixa de spam.
          </Text>
          <Button title="Voltar pro login" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      ) : (
        <View style={styles.form}>
          <Input
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title="Enviar link de redefinição"
            onPress={handleEnviar}
            loading={isSubmitting}
            style={styles.button}
          />
        </View>
      )}
    </AuthScaffold>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
  sucessoBox: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  sucessoTexto: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
