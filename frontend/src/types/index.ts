export type Papel = 'admin' | 'ministro' | 'vocal' | 'membro';

/** Eixo organizacional (permissões) — spec 02. */
export type PapelOrg = 'administrador' | 'lider' | 'membro';
/** Eixo musical (escalas) — spec 02. Pode ser null. */
export type PapelMinisterio = 'ministro' | 'vocal' | 'instrumentista';

export type PlanoOrg = 'free' | 'pro';

export interface Organizacao {
  id: number;
  nome: string;
  codigo?: string;
  slug?: string;
  plano?: PlanoOrg;
  criado_por?: number | null;
  created_at?: string;
}

export type DiaSemana = 'quarta' | 'sabado' | 'domingo';

// --- Biblioteca de vídeos (spec 08) ---

export type CategoriaVideo = 'oficial' | 'playback' | 'tutorial' | 'ministracao';

export interface Musica {
  id: number;
  nome: string;
  tom_padrao: string | null;
  bpm: number | null;
  created_at?: string;
}

export interface Video {
  id: number;
  musica_id: number;
  provider: string;
  video_id: string;
  categoria: CategoriaVideo;
  titulo: string | null;
  adicionado_por?: number | null;
  created_at?: string;
  /** Presente em GET /videos (lista geral, com JOIN na música). */
  musica_nome?: string;
}

export type StatusEscalaVocal = 'pendente' | 'confirmado' | 'recusado';

export interface Membro {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: Papel;
  /** Eixo organizacional (permissões) — spec 02. */
  papel_org?: PapelOrg;
  /** Eixo musical (escalas) — spec 02. */
  papel_ministerio?: PapelMinisterio | null;
  instrumentos: string[];
  ativo?: boolean;
}

export interface Culto {
  id: number;
  data_hora: string;
  tipo: string | null;
}

export interface EscalaFixa {
  id: number;
  membro_id: number;
  dia_semana: DiaSemana;
  funcao: string;
  nome?: string;
}

export interface Excecao {
  id: number;
  escala_fixa_id: number;
  data: string;
  substituto_id: number | null;
}

export interface EscalaVocal {
  id: number;
  membro_id: number;
  culto_id: number;
  status: StatusEscalaVocal;
}

export interface Repertorio {
  id: number;
  culto_id: number;
  nome: string;
  tom: string;
  link_musica: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

/**
 * Formato que GET /escala-fixa (todos os membros) devolve — é um JOIN,
 * não a entidade EscalaFixa crua. Sem `id`: essa consulta não devolve
 * qual linha é qual, só a visão geral pra admin/ministro.
 */
export interface EscalaFixaMontada {
  id: number;
  dia_semana: DiaSemana;
  funcao: string;
  nome: string;
  papel: Papel;
}

/**
 * Formato que GET /escala-fixa/me devolve — como é "meus próprios"
 * vínculos, essa consulta já inclui o `id`, necessário pra criar uma
 * exceção referenciando essa linha específica.
 */
export interface MinhaEscalaFixaItem {
  id: number;
  dia_semana: DiaSemana;
  funcao: string;
  nome: string;
}

/**
 * Formato de cada item de GET /escala-vocal/me — os compromissos de
 * vocal do usuário logado, já com o culto e o status de confirmação.
 */
export interface MinhaEscalaVocalItem {
  id: number;
  status: StatusEscalaVocal;
  culto_id: number;
  data_hora: string;
  tipo: string | null;
}

/**
 * Formato de cada item de GET /escala-fixa/efetiva — já considera
 * substituições (excecoes), por isso "quem_toca" pode ser o titular
 * ou o substituto.
 */
export interface EscalaEfetivaItem {
  escala_fixa_id: number;
  dia_semana: DiaSemana;
  funcao: string;
  quem_toca: string;
}

/**
 * Formato de cada item de GET /escala-vocal/sugestao. `ultima_vez` é
 * null quando o vocal nunca foi escalado antes (prioridade máxima).
 */
export interface SugestaoVocal {
  id: number;
  nome: string;
  ultima_vez: string | null;
}

/**
 * Formato de cada item de GET /escala-vocal/culto/:cultoId — quem está
 * escalado como vocal num culto específico, com nome já resolvido via JOIN.
 */
export interface EscalaVocalDoCultoItem {
  id: number;
  membro_id: number;
  nome: string;
  status: StatusEscalaVocal;
}

/**
 * Escala "avulsa": vínculo pontual membro + culto + função, pra cobrir
 * cultos fora da rotina fixa (ex: um culto especial numa segunda-feira),
 * já que escala_fixa só existe por dia da semana (quarta/sábado/domingo).
 */
export interface EscalaAvulsaDoCultoItem {
  id: number;
  membro_id: number;
  nome: string;
  funcao: string;
  status: StatusEscalaVocal;
}

/**
 * Formato de cada item de GET /escala-avulsa/me — os compromissos
 * avulsos do usuário logado, já com o culto e a função.
 */
export interface MinhaEscalaAvulsaItem {
  id: number;
  status: StatusEscalaVocal;
  culto_id: number;
  data_hora: string;
  tipo: string | null;
  funcao: string;
}

/**
 * Tipos de notificação que o back-end gera hoje. 'repertorio' e
 * 'lembrete' ainda não têm gatilho — reservados pro futuro.
 */
export type TipoNotificacao = 'escala' | 'substituicao' | 'confirmacao' | 'repertorio' | 'lembrete';

/**
 * Formato de cada item de GET /notificacoes/me.
 */
export interface Notificacao {
  id: number;
  membro_id: number;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  lida: boolean;
  created_at: string;
}
