import { LinkingOptions } from '@react-navigation/native';
import { AuthStackParamList } from './AuthNavigator';
import { MainStackParamList } from './MainNavigator';
import { MainTabParamList } from './MainTabs';

type LinkingParamList = AuthStackParamList & MainStackParamList & MainTabParamList;

/**
 * Sem isso, no navegador/PWA cada navegação interna não gera uma entrada no
 * histórico do browser — o botão voltar (inclusive o botão físico/gesto do
 * Android) não tem o que "desfazer" e acaba saindo do app inteiro em vez de
 * voltar pra tela anterior. Com o linking, cada tela vira uma URL de verdade.
 */
export const linking: LinkingOptions<LinkingParamList> = {
  prefixes: [],
  config: {
    screens: {
      Login: 'login',
      EsqueciSenha: 'esqueci-senha',
      RedefinirSenha: 'redefinir-senha',
      MainTabs: {
        screens: {
          Home: '',
          Agenda: 'agenda',
          Notificacoes: 'notificacoes',
          Perfil: 'perfil',
        },
      },
      Escalas: 'escalas',
      EscalaFixa: 'escala-fixa',
      Confirmacoes: 'confirmacoes',
      DetalhesCulto: 'cultos/:cultoId',
      Membros: 'membros',
      DetalheMembro: 'membros/:membroId?',
    },
  },
};
