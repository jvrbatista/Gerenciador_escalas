import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { SeletorInstrumentos } from '@/components/SeletorInstrumentos';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { useAuth } from '@/contexts/AuthContext';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { PapelOrg, PapelMinisterio } from '@/types';
import { papelOrgLabel, papelMinisterioLabel, isAdmin } from '@/utils/papel';
import { confirmAction } from '@/utils/confirm';
import { formatTelefone } from '@/utils/telefone';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const PAPEIS_ORG: PapelOrg[] = ['administrador', 'lider', 'membro'];
const PAPEIS_MINISTERIO: (PapelMinisterio | null)[] = [null, 'ministro', 'vocal', 'instrumentista'];

function labelPapelMinisterio(papel: PapelMinisterio | null): string {
  return papel ? papelMinisterioLabel[papel] : 'Nenhum';
}

export function DetalheMembroScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<MainStackParamList, 'DetalheMembro'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { membroId } = route.params ?? {};
  const isNovo = !membroId;
  const ehAdmin = user ? isAdmin(user) : false;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instrumentos, setInstrumentos] = useState<string[]>([]);
  const [senha, setSenha] = useState('');
  const [papelOrg, setPapelOrg] = useState<PapelOrg>('membro');
  const [papelPickerAberto, setPapelPickerAberto] = useState(false);
  const [papelMinisterio, setPapelMinisterio] = useState<PapelMinisterio | null>(null);
  const [papelMinisterioPickerAberto, setPapelMinisterioPickerAberto] = useState(false);

  const [isLoading, setIsLoading] = useState(!isNovo);
  const [isSaving, setIsSaving] = useState(false);
  const [isDesativando, setIsDesativando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarMembro = useCallback(async () => {
    if (!membroId) return;
    setIsLoading(true);
    setError(null);
    try {
      const membro = await membrosService.getMembroPorId(membroId);
      setNome(membro.nome);
      setEmail(membro.email);
      setTelefone(membro.telefone ?? '');
      setInstrumentos(membro.instrumentos ?? []);
      if (membro.papel_org) setPapelOrg(membro.papel_org);
      setPapelMinisterio(membro.papel_ministerio ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o membro.');
    } finally {
      setIsLoading(false);
    }
  }, [membroId]);

  useEffect(() => {
    carregarMembro();
  }, [carregarMembro]);

  async function handleSalvar() {
    if (!nome.trim() || !email.trim() || !telefone.trim() || instrumentos.length === 0) {
      Alert.alert('Preencha tudo', 'Nome, e-mail, telefone e ao menos um instrumento são obrigatórios.');
      return;
    }

    if (isNovo && senha.trim().length < 6) {
      Alert.alert('Senha muito curta', 'A senha inicial precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      if (isNovo) {
        await membrosService.cadastrarMembro({
          name: nome.trim(),
          email: email.trim(),
          passwordUser: senha.trim(),
          papelOrg,
          papelMinisterio,
          instruments: instrumentos,
          phone: telefone.trim(),
        });
        Alert.alert(
          'Membro cadastrado',
          'O membro foi cadastrado. Ele pode trocar essa senha inicial em Perfil > Segurança.',
        );
      } else {
        await membrosService.atualizarMembro(membroId, {
          name: nome.trim(),
          phone: telefone.trim(),
          instruments: instrumentos,
          email: email.trim(),
          // só manda papelOrg/papelMinisterio se quem edita é admin — o back-end
          // rejeita a troca de papel de qualquer outra pessoa, mesmo que seja o
          // valor atual, então nem vale a pena mandar nesse caso.
          ...(ehAdmin ? { papelOrg, papelMinisterio } : {}),
        });
        Alert.alert('Alterações salvas', 'Os dados do membro foram atualizados.');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível salvar as alterações.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDesativar() {
    if (!membroId) return;

    confirmAction(
      {
        title: 'Desativar membro',
        message: `Isso remove "${nome}" de todas as listas e escalas futuras. Ele deixa de conseguir entrar no app. Confirmar?`,
        confirmLabel: 'Desativar',
      },
      async () => {
        setIsDesativando(true);
        try {
          await membrosService.desativarMembro(membroId);
          Alert.alert('Membro desativado', `${nome} foi desativado com sucesso.`);
          navigation.goBack();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível desativar o membro.',
          );
        } finally {
          setIsDesativando(false);
        }
      },
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Tentar novamente"
          onPress={carregarMembro}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={isNovo ? 'Novo Membro' : 'Editar Membro'} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nome ? nome[0] : '+'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            icon="person-outline"
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
          />
          <Input
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            icon="call-outline"
            placeholder="(DDD) 90000-0000"
            value={telefone}
            onChangeText={(text) => setTelefone(formatTelefone(text))}
            keyboardType="phone-pad"
            maxLength={15}
          />
          <Text style={styles.label}>Instrumentos/funções</Text>
          <SeletorInstrumentos selecionados={instrumentos} onChange={setInstrumentos} />

          {isNovo && (
            <Input
              icon="lock-closed-outline"
              placeholder="Senha inicial"
              value={senha}
              onChangeText={setSenha}
              isPassword
            />
          )}

          {ehAdmin && (
            <>
              <Text style={styles.label}>Papel na organização</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setPapelPickerAberto(true)}>
                <Icon name="shield-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.selectorText}>{papelOrgLabel[papelOrg]}</Text>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <Text style={styles.label}>Papel no ministério</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setPapelMinisterioPickerAberto(true)}>
                <Icon name="musical-notes-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.selectorText}>{labelPapelMinisterio(papelMinisterio)}</Text>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <Button
          title="Salvar"
          onPress={handleSalvar}
          loading={isSaving}
          disabled={isDesativando}
          style={styles.saveButton}
        />

        {ehAdmin && !isNovo && (
          <Button
            title="Desativar membro"
            onPress={handleDesativar}
            loading={isDesativando}
            disabled={isSaving}
            variant="outline"
            style={styles.deactivateButton}
          />
        )}
      </ScrollView>

      <Modal
        visible={papelPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setPapelPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolher papel na organização</Text>
            {PAPEIS_ORG.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setPapelOrg(item);
                  setPapelPickerAberto(false);
                }}
              >
                <Text style={styles.modalItemText}>{papelOrgLabel[item]}</Text>
                {papelOrg === item && (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setPapelPickerAberto(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={papelMinisterioPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setPapelMinisterioPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolher papel no ministério</Text>
            {PAPEIS_MINISTERIO.map((item) => (
              <TouchableOpacity
                key={item ?? 'nenhum'}
                style={styles.modalItem}
                onPress={() => {
                  setPapelMinisterio(item);
                  setPapelMinisterioPickerAberto(false);
                }}
              >
                <Text style={styles.modalItemText}>{labelPapelMinisterio(item)}</Text>
                {papelMinisterio === item && (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setPapelMinisterioPickerAberto(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 200,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  avatarBlock: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.primary,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deactivateButton: {
    marginTop: spacing.sm,
    borderColor: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalCancelButton: {
    marginTop: spacing.sm,
  },
});
