import { api } from './api';
import { Organizacao } from '@/types';

export interface CriarOrganizacaoInput {
  nomeOrg: string;
  prefixo?: string;
  name: string;
  email: string;
  passwordUser: string;
  phone?: string;
  instruments?: string[];
}

export interface EntrarOrganizacaoInput {
  codigo: string;
  name: string;
  email: string;
  passwordUser: string;
  phone?: string;
  instruments?: string[];
}

export interface OrganizacaoResumo {
  id: number;
  nome: string;
  codigo?: string;
}

interface AuthOrgResponse {
  token: string;
  organizacao: OrganizacaoResumo;
  message: string;
}

/**
 * Cria uma nova organização; o usuário informado vira admin dela.
 * Devolve o token e o resumo da org (com o código de convite gerado).
 */
export async function criarOrganizacao(input: CriarOrganizacaoInput): Promise<AuthOrgResponse> {
  const response = await api.post<AuthOrgResponse>('/organizacoes', input);
  return response.data;
}

/**
 * Entra em uma organização existente via código de convite, criando o membro.
 */
export async function entrarComCodigo(input: EntrarOrganizacaoInput): Promise<AuthOrgResponse> {
  const response = await api.post<AuthOrgResponse>('/organizacoes/entrar', input);
  return response.data;
}

/**
 * Organização do usuário logado (nome + código de convite pra compartilhar).
 */
export async function getOrganizacaoAtual(): Promise<Organizacao> {
  const response = await api.get<Organizacao>('/organizacoes/atual');
  return response.data;
}
