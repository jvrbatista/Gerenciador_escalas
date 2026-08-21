import { api } from './api';
import { Membro, PapelOrg, PapelMinisterio } from '@/types';

export interface AtualizarMembroInput {
  name: string;
  phone: string;
  instruments: string[];
  email: string;
  /** Papel na organização — só é aplicado de fato pelo back-end se quem chama for admin. */
  papelOrg?: PapelOrg;
  /** Papel no ministério — mesma regra do papelOrg (só admin de fato aplica). `null` = nenhum. */
  papelMinisterio?: PapelMinisterio | null;
}

export interface AlterarSenhaInput {
  senhaAtual: string;
  novaSenha: string;
}

export interface RedefinirSenhaInput {
  token: string;
  novaSenha: string;
}

export interface CadastrarMembroInput {
  name: string;
  email: string;
  passwordUser: string;
  papelOrg: PapelOrg;
  papelMinisterio: PapelMinisterio | null;
  instruments: string[];
  phone: string;
}

/**
 * Dados do próprio usuário logado.
 */
export async function getMeuPerfil(): Promise<Membro> {
  const response = await api.get<Membro>('/membros/me');
  return response.data;
}

/**
 * Lista todos os membros. Só admin.
 */
export async function getTodosMembros(): Promise<Membro[]> {
  const response = await api.get<Membro[]>('/membros');
  return response.data;
}

/**
 * Busca um membro específico. Admin e ministro.
 */
export async function getMembroPorId(id: number): Promise<Membro> {
  const response = await api.get<Membro>(`/membros/${id}`);
  return response.data;
}

/**
 * Atualiza os dados de um membro. O próprio dono do registro, ou admin.
 * Os 4 campos são obrigatórios (o back-end não faz atualização parcial).
 */
export async function atualizarMembro(id: number, input: AtualizarMembroInput): Promise<void> {
  await api.put(`/membros/${id}`, input);
}

/**
 * Desativa (soft delete) um membro. Só admin.
 */
export async function desativarMembro(id: number): Promise<void> {
  await api.delete(`/membros/${id}`);
}

/**
 * Troca a própria senha. Exige a senha atual pra confirmar — nem admin
 * consegue trocar a senha de outra pessoa por aqui, só o dono da conta.
 */
export async function alterarSenha(id: number, input: AlterarSenhaInput): Promise<void> {
  await api.put(`/membros/${id}/senha`, input);
}

/**
 * Pede o e-mail de redefinição de senha. A resposta é sempre "sucesso" (o
 * back-end não revela se o e-mail existe, pra evitar enumeração de contas).
 */
export async function esqueciSenha(email: string): Promise<void> {
  await api.post('/membros/esqueci-senha', { email });
}

/**
 * Redefine a senha a partir do token recebido por e-mail (válido por 30min).
 */
export async function redefinirSenha(input: RedefinirSenhaInput): Promise<void> {
  await api.post('/membros/redefinir-senha', input);
}

/**
 * Cadastra um membro novo com uma senha inicial (definida por quem
 * cadastra). O próprio membro pode trocá-la depois em "Segurança". Só
 * admin.
 */
export async function cadastrarMembro(input: CadastrarMembroInput): Promise<void> {
  await api.post('/membros/cadastro', input);
}
