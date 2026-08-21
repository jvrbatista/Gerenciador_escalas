import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { INSTRUMENTOS, InstrumentoDef } from '@/config/instrumentos';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { spacing, typography } from '@/theme';

interface SeletorInstrumentosProps {
  selecionados: string[];
  onChange: (instrumentos: string[]) => void;
}

/** Ícone Lucide ou imagem própria (tingida com a cor do tema), o que o instrumento tiver. */
export function IconeInstrumento({ item, cor, size = 20 }: { item: InstrumentoDef; cor: string; size?: number }) {
  if (item.imagem) {
    return <Image source={item.imagem} style={{ width: size, height: size, tintColor: cor }} resizeMode="contain" />;
  }
  return <Icon name={item.icon} size={size} color={cor} />;
}

/**
 * Seletor de instrumentos/funções — mesmo padrão visual do modal "Escolher papel"
 * (lista com ícone + check), mas de múltipla escolha: tocar num item alterna a
 * seleção sem fechar o modal.
 */
export function SeletorInstrumentos({ selecionados, onChange }: SeletorInstrumentosProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [modalAberto, setModalAberto] = useState(false);

  function alternar(nome: string) {
    if (selecionados.includes(nome)) {
      onChange(selecionados.filter((i) => i !== nome));
    } else {
      onChange([...selecionados, nome]);
    }
  }

  // O ícone do gatilho segue o primeiro instrumento escolhido (não um genérico fixo).
  const itemPrimeiro = selecionados.length > 0
    ? INSTRUMENTOS.find((i) => i.nome === selecionados[0])
    : undefined;

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setModalAberto(true)}>
        {itemPrimeiro ? (
          <IconeInstrumento item={itemPrimeiro} cor={colors.textSecondary} />
        ) : (
          <Icon name="musical-notes-outline" size={20} color={colors.textSecondary} />
        )}
        <Text style={styles.selectorText} numberOfLines={1}>
          {selecionados.length > 0 ? selecionados.join(', ') : 'Selecionar instrumentos/funções'}
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
            <Text style={styles.modalTitle}>Instrumentos/funções</Text>
            {INSTRUMENTOS.map((item) => {
              const ativo = selecionados.includes(item.nome);
              return (
                <TouchableOpacity
                  key={item.nome}
                  style={styles.modalItem}
                  onPress={() => alternar(item.nome)}
                >
                  <View style={styles.modalItemLado}>
                    <IconeInstrumento item={item} cor={ativo ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.modalItemText, ativo && styles.modalItemTextAtivo]}>{item.nome}</Text>
                  </View>
                  {ativo && <Icon name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <Button title="Concluir" onPress={() => setModalAberto(false)} style={styles.modalCancelButton} />
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
  modalCancelButton: {
    marginTop: spacing.sm,
  },
});
