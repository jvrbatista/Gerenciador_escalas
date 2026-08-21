import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/** Extrai só os dígitos e formata como HH:mm — os dois pontos nunca são digitados. */
function formatarHorario(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) {
    return digitos;
  }
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

interface EntradaHorarioProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength'> {
  value: string;
  onChangeText: (v: string) => void;
}

/**
 * Campo de horário (HH:mm) mascarado — o usuário só digita números, os dois pontos
 * aparecem sozinhos assim que passa de 2 dígitos. Mais rápido que digitar "19:00" à mão.
 */
export function EntradaHorario({ value, onChangeText, ...rest }: EntradaHorarioProps) {
  return (
    <TextInput
      {...rest}
      value={value}
      onChangeText={(texto) => onChangeText(formatarHorario(texto))}
      keyboardType="number-pad"
      maxLength={5}
    />
  );
}
