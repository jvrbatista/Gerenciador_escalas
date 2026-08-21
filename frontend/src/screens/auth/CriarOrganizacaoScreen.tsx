import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  navigation: StackNavigationProp<AuthStackParamList, 'CriarOrganizacao'>;
};

export function CriarOrganizacaoScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { criarOrganizacao } = useAuth();

  const [nomeOrg, setNomeOrg] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instrumentos, setInstrumentos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCriar() {
    if (!nomeOrg.trim() || !nome.trim() || !email.trim() || !senha) {
      setError('Preencha nome da igreja, seu nome, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const org = await criarOrganizacao({
        nomeOrg: nomeOrg.trim(),
        name: nome.trim(),
        email: email.trim(),
        passwordUser: senha,
        phone: telefone.trim() || undefined,
        instruments: instrumentos.length > 0 ? instrumentos : undefined,
      });
      // Sucesso: o RootNavigator troca pra área logada. Mostramos o código
      // de convite pro admin já anotar/compartilhar.
      Alert.alert(
        'Organização criada!',
        `Compartilhe este código para sua equipe entrar:\n\n${org.codigo ?? '(veja no seu perfil)'}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a organização.');
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
        <Text style={styles.title}>Criar organização</Text>
        <Text style={styles.subtitle}>Você será o administrador da sua igreja.</Text>
      </View>

      <View style={styles.form}>
        <Input
          icon="business-outline"
          placeholder="Nome da igreja"
          value={nomeOrg}
          onChangeText={setNomeOrg}
          autoCapitalize="words"
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
          title="Criar organização"
          onPress={handleCriar}
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
