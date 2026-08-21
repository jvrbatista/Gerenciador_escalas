import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/AuthScaffold';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'RedefinirSenha'>;
};

export function RedefinirSenhaScreen({ navigation }: Props) {
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<AuthStackParamList, 'RedefinirSenha'>>();
  const { token } = route.params ?? {};

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRedefinir() {
    if (!token) {
      setError('Link inválido. Peça um novo em "Esqueci minha senha".');
      return;
    }
    if (novaSenha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await membrosService.redefinirSenha({ token, novaSenha });
      Alert.alert('Senha redefinida', 'Sua senha foi atualizada. Faça login com a nova senha.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <View style={styles.header}>
        <Text style={styles.title}>Escolher nova senha</Text>
        <Text style={styles.subtitle}>Defina uma nova senha pra sua conta.</Text>
      </View>

      {!token ? (
        <Text style={styles.error}>
          Link inválido ou incompleto. Peça um novo link em &quot;Esqueci minha senha&quot;, na
          tela de login.
        </Text>
      ) : (
        <View style={styles.form}>
          <Input
            icon="lock-closed-outline"
            placeholder="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            isPassword
          />
          <Input
            icon="lock-closed-outline"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            isPassword
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title="Redefinir senha"
            onPress={handleRedefinir}
            loading={isSubmitting}
            style={styles.button}
          />
        </View>
      )}
    </AuthScaffold>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
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
});
