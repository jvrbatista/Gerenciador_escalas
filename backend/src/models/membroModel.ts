import { PoolClient } from 'pg';
import { query, unscopedQuery } from '../config/database';
import { derivarPapelLegado } from '../utils/papeis';
import type { PapelOrg, PapelMinisterio } from '../config/capacidades';

/**
 * `client` opcional: quando informado (por ex. dentro de um `withBypass`), roda
 * nele em vez de cair no `query()` normal com escopo de tenant. Necessário pra
 * fluxos pré-auth e cross-tenant legítimos (entrar por código) — sem sessão de
 * org ainda, o RLS fail-closed bloqueia o INSERT.
 */
export async function createMembers(
    name: string,
    phone: string,
    instruments: string[],
    email: string,
    papelOrg: PapelOrg,
    papelMinisterio: PapelMinisterio | null,
    password: string,
    orgId: number,
    client?: PoolClient) {

    // Papel legado (coluna `papel`) é só um reflexo dos dois eixos reais agora — ver
    // `derivarPapelLegado` sobre por que ele ainda existe.
    const papelLegado = derivarPapelLegado(papelOrg, papelMinisterio);

    const sql = 'INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
    const params = [name, phone, instruments, email, papelLegado, papelOrg, papelMinisterio, password, orgId];
    const result = client ? await client.query(sql, params) : await query(sql, params);

    return result.rows[0];

}

export async function findByEmail(email: string) {
    // Login roda pré-auth (ainda não há org na sessão) e o email é único global →
    // busca cross-tenant legítima. Precisa de bypass, senão o RLS devolve 0 linhas.
    const membro = await unscopedQuery('SELECT * FROM membros WHERE email = $1', [email])

    return membro.rows[0];
}

export async function findById(id: number) {
    const membro = await query('SELECT id, nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio FROM membros WHERE ativo = true AND id = $1', [id])
    return membro.rows[0];
}

export async function findAllMembers() {
    const membros = await query('SELECT id, nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio FROM membros WHERE ativo = true');
    return membros.rows;
}

export async function updateMember(
    id: number,
    name: string,
    phone: string,
    instruments: string[],
    email: string,
    papelOrg: PapelOrg,
    papelMinisterio: PapelMinisterio | null,
) {
    // `papelMinisterio` é sempre recalculado a partir dos instrumentos (também quando
    // quem edita não é admin) — só `papelOrg` exige a capacidade `membro.papel.alterar`,
    // já validada no controller antes de chegar aqui.
    const papelLegado = derivarPapelLegado(papelOrg, papelMinisterio);
    const alteracoes = await query(
        'UPDATE membros SET nome = $1, telefone = $2, instrumentos = $3, email = $4, papel = $5, papel_org = $6, papel_ministerio = $7 WHERE id = $8 RETURNING *',
        [name, phone, instruments, email, papelLegado, papelOrg, papelMinisterio, id],
    );
    return alteracoes.rows[0];
}

export async function deactivateMember(id: number, ative: boolean) {
    const alteracoes = await query('UPDATE membros SET ativo = $1 WHERE id = $2 RETURNING *', [ative, id]);
    return alteracoes.rows[0]
}

export async function findByIdComSenha(id: number) {
    const result = await query('SELECT * FROM membros WHERE ativo = true AND id = $1', [id]);
    return result.rows[0];
}

export async function updatePassword(id: number, hashPassword: string) {
    const result = await query('UPDATE membros SET senha = $1 WHERE id = $2 RETURNING *', [hashPassword, id]);
    return result.rows[0];
}

export async function findAdminsAtivos() {
    const result = await query("SELECT id FROM membros WHERE papel = 'admin' AND ativo = true");
    return result.rows;
}