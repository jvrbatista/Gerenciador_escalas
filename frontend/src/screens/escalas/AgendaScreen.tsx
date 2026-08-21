import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaFixaService from '@/services/escalaFixa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as excecoesService from '@/services/excecoes';
import { ApiError } from '@/services/api';
import {
  Culto,
  DiaSemana,
  MinhaEscalaAvulsaItem,
  MinhaEscalaFixaItem,
  MinhaEscalaVocalItem,
  StatusEscalaVocal,
} from '@/types';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { confirmAction } from '@/utils/confirm';

const statusLabel: Record<StatusEscalaVocal, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
};

const statusTone: Record<StatusEscalaVocal, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  confirmado: 'success',
  recusado: 'error',
};

const diaSemanaPorIndice: Record<number, DiaSemana> = {
  0: 'domingo',
  3: 'quarta',
  6: 'sabado',
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function AgendaScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [escalaVocal, setEscalaVocal] = useState<MinhaEscalaVocalItem[]>([]);
  const [escalaAvulsa, setEscalaAvulsa] = useState<MinhaEscalaAvulsaItem[]>([]);
  const [escalaFixa, setEscalaFixa] = useState<MinhaEscalaFixaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [proximoCultoPorDia, setProximoCultoPorDia] = useState<Partial<Record<DiaSemana, Culto>>>(
    {},
  );

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vocal, avulsa, fixa, todosCultos] = await Promise.all([
        escalaVocalService.getMinhaEscalaVocal(),
        escalaAvulsaService.getMinhaEscalaAvulsa(),
        escalaFixaService.getMinhaEscalaFixa(),
        cultosService.getTodosCultos(),
      ]);
      setEscalaVocal(vocal);
      setEscalaAvulsa(avulsa);
      setEscalaFixa(fixa);

      const agora = new Date();
      const proximoPorDia: Partial<Record<DiaSemana, Culto>> = {};
      for (const culto of todosCultos) {
        const dataCulto = new Date(culto.data_hora);
        if (dataCulto < agora) continue;
        const dia = diaSemanaPorIndice[dataCulto.getDay()];
        if (!dia) continue;
        const atual = proximoPorDia[dia];
        if (!atual || dataCulto < new Date(atual.data_hora)) {
          proximoPorDia[dia] = culto;
        }
      }
      setProximoCultoPorDia(proximoPorDia);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar sua agenda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleAtualizarStatus(item: MinhaEscalaVocalItem, status: StatusEscalaVocal) {
    setActionLoadingId(item.id);
    try {
      await escalaVocalService.confirmarPresenca(item.id, status);
      setEscalaVocal((prev) => prev.map((e) => (e.id === item.id ? { ...e, status } : e)));
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAtualizarStatusAvulsa(item: MinhaEscalaAvulsaItem, status: StatusEscalaVocal) {
    setActionLoadingId(item.id);
    try {
      await escalaAvulsaService.confirmarPresencaAvulsa(item.id, status);
      setEscalaAvulsa((prev) => prev.map((e) => (e.id === item.id ? { ...e, status } : e)));
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleRecusarEscalaFixa(item: MinhaEscalaFixaItem) {
    if (!selectedDate) {
      Alert.alert(
        'Selecione uma data',
        'Toque no dia do calendário em que você vai faltar antes de recusar.',
      );
      return;
    }

    confirmAction(
      {
        title: 'Recusar presença',
        message: `Isso registra uma falta para "${item.funcao}" (${item.dia_semana}) no dia ${selectedDate}. O ministério vai precisar definir um substituto pra essa data. Confirmar?`,
        confirmLabel: 'Recusar',
      },
      async () => {
        setActionLoadingId(item.id);
        try {
          await excecoesService.criarExcecao({ escalaFixaId: item.id, data: selectedDate });
          Alert.alert(
            'Registrado',
            'Sua falta foi registrada. Você será avisado quando um substituto for definido.',
          );
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível registrar a falta.',
          );
        } finally {
          setActionLoadingId(null);
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

  const markedDates: Record<
    string,
    { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
  > = {};
  for (const item of escalaVocal) {
    const day = item.data_hora.slice(0, 10);
    markedDates[day] = { ...markedDates[day], marked: true, dotColor: colors.primary };
  }
  for (const item of escalaAvulsa) {
    const day = item.data_hora.slice(0, 10);
    markedDates[day] = { ...markedDates[day], marked: true, dotColor: colors.primary };
  }
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Agenda</Text>
        <Text style={styles.subtitle}>Seus próximos compromissos</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.calendarCard}>
          <Calendar
            // `react-native-calendars` não reage bem a mudança de tema via prop depois de
            // montado — forçar remount na troca de modo garante que a paleta nova aplique.
            key={modo}
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.textInverse,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.primary,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
            }}
          />
        </Card>

        {escalaVocal.length === 0 && escalaAvulsa.length === 0 && escalaFixa.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>Você não tem compromissos futuros registrados.</Text>
          </Card>
        )}

        {escalaVocal.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos de vocal</Text>
            </View>

            {escalaVocal.map((item) => (
            <Card
              key={item.id}
              style={styles.compromisso}
              onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
            >
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                <Text style={styles.compromissoHora}>
                  {formatHora(item.data_hora)}
                  {item.tipo ? ` · ${item.tipo}` : ''}
                </Text>
                <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
              </View>
              {item.status === 'pendente' && (
                <View style={styles.acoes}>
                  <Button
                    title="Confirmar"
                    onPress={() => handleAtualizarStatus(item, 'confirmado')}
                    loading={actionLoadingId === item.id}
                    style={styles.acaoBotao}
                  />
                  <Button
                    title="Recusar"
                    onPress={() => handleAtualizarStatus(item, 'recusado')}
                    loading={actionLoadingId === item.id}
                    variant="outline"
                    style={styles.acaoBotao}
                  />
                </View>
              )}
            </Card>
            ))}
          </>
        )}

        {escalaAvulsa.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos</Text>
            </View>

            {escalaAvulsa.map((item) => (
            <Card
              key={item.id}
              style={styles.compromisso}
              onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
            >
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                <Text style={styles.compromissoHora}>
                  {formatHora(item.data_hora)} · {item.funcao}
                </Text>
                <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
              </View>
              {item.status === 'pendente' && (
                <View style={styles.acoes}>
                  <Button
                    title="Confirmar"
                    onPress={() => handleAtualizarStatusAvulsa(item, 'confirmado')}
                    loading={actionLoadingId === item.id}
                    style={styles.acaoBotao}
                  />
                  <Button
                    title="Recusar"
                    onPress={() => handleAtualizarStatusAvulsa(item, 'recusado')}
                    loading={actionLoadingId === item.id}
                    variant="outline"
                    style={styles.acaoBotao}
                  />
                </View>
              )}
            </Card>
            ))}
          </>
        )}

        {escalaFixa.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sua escala fixa</Text>
            </View>

            {escalaFixa.map((item) => {
              const proximoCulto = proximoCultoPorDia[item.dia_semana];
              return (
              <Card
                key={item.id}
                style={styles.compromisso}
                onPress={
                  proximoCulto
                    ? () => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.id })
                    : undefined
                }
              >
                <View style={styles.compromissoInfo}>
                  <Text style={styles.compromissoDia}>{capitalize(item.dia_semana)}</Text>
                  <Text style={styles.compromissoHora}>{item.funcao}</Text>
                  {!proximoCulto && (
                    <Text style={styles.semCultoTexto}>
                      Nenhum culto futuro criado ainda pra esse dia
                    </Text>
                  )}
                </View>
                <Button
                  title="Recusar"
                  onPress={() => handleRecusarEscalaFixa(item)}
                  loading={actionLoadingId === item.id}
                  variant="outline"
                  style={styles.acaoBotaoUnico}
                />
              </Card>
              );
            })}
          </>
        )}
      </ScrollView>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  calendarCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  compromisso: {
    gap: spacing.sm,
  },
  compromissoInfo: {
    gap: 4,
  },
  compromissoDia: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  compromissoHora: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  semCultoTexto: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  acoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acaoBotao: {
    flex: 1,
  },
  acaoBotaoUnico: {
    alignSelf: 'flex-start',
    minWidth: 120,
  },
});
