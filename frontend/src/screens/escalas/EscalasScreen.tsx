import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EntradaHorario } from '@/components/EntradaHorario';
import { Header } from '@/components/Header';
import { OptionsMenu } from '@/components/OptionsMenu';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import { ApiError } from '@/services/api';
import { Culto } from '@/types';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaCompleto, formatDiaSemana, formatHora, montarDataHoraISO } from '@/utils/date';
import { confirmAction } from '@/utils/confirm';

export function EscalasScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();

  const [cultos, setCultos] = useState<Culto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [novoCultoAberto, setNovoCultoAberto] = useState(false);
  const [novaData, setNovaData] = useState<string | null>(null);
  const [novaHora, setNovaHora] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [criandoCulto, setCriandoCulto] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todos = await cultosService.getTodosCultos();
      setCultos(todos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os cultos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function abrirNovoCulto() {
    setNovaData(null);
    setNovaHora('');
    setNovoTipo('');
    setNovoCultoAberto(true);
  }

  async function handleCriarCulto() {
    if (!novaData || !novaHora.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o dia e informe o horário antes de criar.');
      return;
    }

    const dataHora = montarDataHoraISO(novaData, novaHora.trim());
    if (!dataHora) {
      Alert.alert('Horário inválido', 'Use o formato HH:mm, por exemplo 19:00.');
      return;
    }

    setCriandoCulto(true);
    try {
      const novoCulto = await cultosService.criarCulto({
        dataHora,
        tipo: novoTipo.trim() || null,
      });
      setNovoCultoAberto(false);
      navigation.navigate('DetalhesCulto', { cultoId: novoCulto.id });
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível criar o culto.');
    } finally {
      setCriandoCulto(false);
    }
  }

  function handleExcluirCulto(culto: Culto) {
    confirmAction(
      {
        title: 'Excluir culto',
        message: `Isso apaga "${culto.tipo ?? formatDiaCompleto(culto.data_hora)}" e tudo vinculado a ele (repertório, escala de vocal e avulsa). Não tem como desfazer. Confirmar?`,
        confirmLabel: 'Excluir',
      },
      async () => {
        setExcluindoId(culto.id);
        try {
          await cultosService.deletarCulto(culto.id);
          setCultos((prev) => prev.filter((c) => c.id !== culto.id));
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível excluir o culto.',
          );
        } finally {
          setExcluindoId(null);
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
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Escalas" showBack />

      <FlatList
        style={styles.list}
        data={cultos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyText}>
              Nenhum culto cadastrado ainda. Toque no + pra criar o primeiro.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.cultoCard}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.id })}
          >
            <View style={styles.cultoIcon}>
              <Icon name="musical-notes" size={18} color={colors.primary} />
            </View>
            <View style={styles.cultoInfo}>
              <Text style={styles.cultoTitulo}>
                {item.tipo ?? `Culto de ${formatDiaSemana(item.data_hora)}`}
              </Text>
              <Text style={styles.cultoData}>
                {formatDiaCompleto(item.data_hora)} · {formatHora(item.data_hora)}
              </Text>
            </View>
            {user?.papel === 'admin' && (
              <OptionsMenu
                loading={excluindoId === item.id}
                actions={[
                  {
                    label: 'Excluir culto',
                    icon: 'trash-outline',
                    destructive: true,
                    onPress: () => handleExcluirCulto(item),
                  },
                ]}
              />
            )}
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        )}
      />

      {user?.papel === 'admin' && (
        <TouchableOpacity style={styles.fab} onPress={abrirNovoCulto}>
          <Icon name="add" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      )}

      <Modal
        visible={novoCultoAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setNovoCultoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo culto</Text>

            <Text style={styles.formLabel}>Dia</Text>
            <Calendar
              // `react-native-calendars` não reage bem a mudança de tema via prop depois de
              // montado — forçar remount na troca de modo garante que a paleta nova aplique.
              key={modo}
              current={novaData ?? undefined}
              markedDates={
                novaData ? { [novaData]: { selected: true, selectedColor: colors.primary } } : {}
              }
              onDayPress={(day: DateData) => setNovaData(day.dateString)}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.textInverse,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                monthTextColor: colors.text,
                arrowColor: colors.primary,
              }}
              style={styles.calendar}
            />

            <Text style={styles.formLabel}>Horário</Text>
            <View style={styles.modalInput}>
              <EntradaHorario
                style={styles.modalTextInput}
                placeholder="19:00"
                placeholderTextColor={colors.textMuted}
                value={novaHora}
                onChangeText={setNovaHora}
              />
            </View>

            <Text style={styles.formLabel}>Tipo do culto (opcional)</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Ex: Culto de Oração"
                placeholderTextColor={colors.textMuted}
                value={novoTipo}
                onChangeText={setNovoTipo}
              />
            </View>

            <Button
              title="Criar culto"
              onPress={handleCriarCulto}
              loading={criandoCulto}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setNovoCultoAberto(false)}
              disabled={criandoCulto}
              style={styles.modalButton}
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
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cultoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cultoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cultoInfo: {
    flex: 1,
  },
  cultoTitulo: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  cultoData: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
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
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  formLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  calendar: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  modalTextInput: {
    ...typography.body,
    color: colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  modalButton: {
    marginTop: spacing.md,
  },
});
