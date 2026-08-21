import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { IconeInstrumento } from '@/components/SeletorInstrumentos';
import { INSTRUMENTOS } from '@/config/instrumentos';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { spacing, typography } from '@/theme';

interface SeletorFuncaoProps {
  selecionado: string | null;
  onChange: (funcao: string) => void;
  placeholder?: string;
}

/**
 * Mesmo seletor de instrumentos/funções do perfil (lista com ícone + check), mas de
 * escolha única — pra escalar alguém numa função específica, tocar já seleciona e
 * fecha o modal (não precisa de "Concluir" como no de múltipla escolha).
 */
export function SeletorFuncao({ selecionado, onChange, placeholder = 'Selecionar função' }: SeletorFuncaoProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [modalAberto, setModalAberto] = useState(false);

  const item = selecionado ? INSTRUMENTOS.find((i) => i.nome === selecionado) : undefined;

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setModalAberto(true)}>
        {item ? (
          <IconeInstrumento item={item} cor={colors.textSecondary} />
        ) : (
          <Icon name="musical-notes-outline" size={20} color={colors.textSecondary} />
        )}
        <Text style={selecionado ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
          {selecionado ?? placeholder}
        </Text>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolher função</Text>
            {INSTRUMENTOS.map((opcao) => {
              const ativo = selecionado === opcao.nome;
              return (
                <TouchableOpacity
                  key={opcao.nome}
                  style={styles.modalItem}
                  onPress={() => {
                    onChange(opcao.nome);
                    setModalAberto(false);
                  }}
                >
                  <View style={styles.modalItemLado}>
                    <IconeInstrumento item={opcao} cor={ativo ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.modalItemText, ativo && styles.modalItemTextAtivo]}>{opcao.nome}</Text>
                  </View>
                  {ativo && <Icon name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
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
  selectorPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
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
  modalItemLado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalItemTextAtivo: {
    color: colors.primary,
    fontWeight: '600',
  },
});
