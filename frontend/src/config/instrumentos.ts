import { ImageSourcePropType } from 'react-native';
import { IconName } from '@/components/Icon';
import iconeMinistro from '../../assets/icons/instrumentos/ministro.png';
import iconeVocal from '../../assets/icons/instrumentos/vocal.png';
import iconeViolao from '../../assets/icons/instrumentos/violao.png';
import iconeGuitarra from '../../assets/icons/instrumentos/guitarra.png';
import iconeBaixo from '../../assets/icons/instrumentos/baixo.png';
import iconeTeclado from '../../assets/icons/instrumentos/teclado.png';
import iconeBateria from '../../assets/icons/instrumentos/bateria.png';

export interface InstrumentoDef {
  nome: string;
  /** Ícone Lucide (padrão do app) — usado quando não há imagem própria. */
  icon: IconName;
  /** Imagem própria (silhueta preta, tingida com a cor do tema em runtime). */
  imagem?: ImageSourcePropType;
}

/** Instrumentos/funções pra escolher no cadastro/perfil do membro, com ícone correspondente. */
export const INSTRUMENTOS: InstrumentoDef[] = [
  { nome: 'Ministro', icon: 'mic-vocal-outline', imagem: iconeMinistro },
  { nome: 'Vocal', icon: 'mic-outline', imagem: iconeVocal },
  { nome: 'Violão', icon: 'guitar-outline', imagem: iconeViolao },
  { nome: 'Guitarra', icon: 'music-outline-2', imagem: iconeGuitarra },
  { nome: 'Baixo', icon: 'music-outline-4', imagem: iconeBaixo },
  { nome: 'Teclado', icon: 'piano-outline', imagem: iconeTeclado },
  { nome: 'Baterista', icon: 'drum-outline', imagem: iconeBateria },
];
