import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/AuthScaffold';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { ApiError } from '@/services/api';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const styles = useThemedStyles(criarEstilos);
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEntrar() {
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível entrar.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEsqueciSenha() {
    navigation.navigate('EsqueciSenha');
  }

  return (
    <AuthScaffold>
      <View style={styles.header}>
        <Logo />
        <Text style={styles.subtitle}>Organize seu ministério com excelência</Text>
      </View>

      <View style={styles.form}>
        <Input
          icon="mail-outline"
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          icon="lock-closed-outline"
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          isPassword
          autoComplete="password"
        />

        <Text style={styles.forgotPassword} onPress={handleEsqueciSenha}>
          Esqueci minha senha
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Entrar"
          onPress={handleEntrar}
          loading={isSubmitting}
          style={styles.button}
        />

        <Text style={styles.footer}>
          Ainda não tem uma conta?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('CriarOrganizacao')}>
            Criar organização
          </Text>
          {'  ·  '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('EntrarOrganizacao')}>
            Entrar com código
          </Text>
        </Text>
      </View>
    </AuthScaffold>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  forgotPassword: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: -spacing.xs,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
