import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SeletorInstrumentos } from '@/components/SeletorInstrumentos';
import { AuthScaffold } from '@/components/AuthScaffold';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { ApiError } from '@/services/api';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'EntrarOrganizacao'>;
};

export function EntrarOrganizacaoScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { entrarComCodigo } = useAuth();

  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instrumentos, setInstrumentos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEntrar() {
    if (!codigo.trim() || !nome.trim() || !email.trim() || !senha) {
      setError('Preencha o código, seu nome, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await entrarComCodigo({
        codigo: codigo.trim().toUpperCase(),
        name: nome.trim(),
        email: email.trim(),
        passwordUser: senha,
        phone: telefone.trim() || undefined,
        instruments: instrumentos.length > 0 ? instrumentos : undefined,
      });
      // Sucesso: o RootNavigator troca pra área logada automaticamente.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar na organização.');
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
        <Text style={styles.title}>Entrar com código</Text>
        <Text style={styles.subtitle}>Use o código de convite da sua igreja.</Text>
      </View>

      <View style={styles.form}>
        <Input
          icon="key-outline"
          placeholder="Código (ex.: QG-83HF92)"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="characters"
        />
        <Input
          icon="person-outline"
          placeholder="Seu nome"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
        />
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
          value={senha}
          onChangeText={setSenha}
          isPassword
        />
        <Input
          icon="call-outline"
          placeholder="Telefone (opcional)"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Instrumentos/funções (opcional)</Text>
        <SeletorInstrumentos selecionados={instrumentos} onChange={setInstrumentos} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Entrar na organização"
          onPress={handleEntrar}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
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
  label: {
    ...typography.caption,
    color: colors.textSecondary,
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
});
