import { query, unscopedQuery, withBypass } from '../config/database';
import { gerarOrgCode } from '../utils/orgCode';
import { slugify } from '../utils/slug';

export async function buscarOrgPorCodigo(codigo: string) {
    // Entrar por código é pré-auth e cross-tenant (o usuário ainda não pertence à
    // org) → bypass, senão a policy `org_self` esconde a org de quem quer entrar.
    const result = await unscopedQuery('SELECT * FROM organizacoes WHERE codigo = $1', [codigo]);
    return result.rows[0];
}

export async function buscarOrgPorId(id: number) {
    const result = await query('SELECT id, nome, codigo, slug, plano, criado_por, created_at FROM organizacoes WHERE id = $1', [id]);
    return result.rows[0];
}

async function codigoExiste(codigo: string): Promise<boolean> {
    // Unicidade do código é global (entre todas as orgs) → bypass, senão a checagem
    // enxergaria só a org atual e geraria códigos colidentes.
    const result = await unscopedQuery('SELECT 1 FROM organizacoes WHERE codigo = $1', [codigo]);
    return result.rows.length > 0;
}

/**
 * Gera um código `PREFIXO-XXXXXX` garantindo unicidade no banco (regenera o
 * sufixo em caso de colisão). Cobre a decisão D-01.3 da spec 01.
 */
export async function gerarCodigoUnico(prefixo: string, maxTentativas = 10): Promise<string> {
    for (let i = 0; i < maxTentativas; i++) {
        const codigo = gerarOrgCode(prefixo);
        if (!(await codigoExiste(codigo))) {
            return codigo;
        }
    }
    throw new Error('Não foi possível gerar um código único para a organização');
}

interface NovaOrgComAdmin {
    nomeOrg: string;
    prefixo: string;
    nome: string;
    email: string;
    senhaHash: string;
    telefone: string;
    instrumentos: string[];
}

/**
 * Cria a organização e o membro admin em uma única transação, resolvendo a
 * dependência circular (organizacoes.criado_por <-> membros.org_id):
 * insere a org, insere o admin vinculado a ela e então preenche `criado_por`.
 */
export async function criarOrganizacaoComAdmin(dados: NovaOrgComAdmin) {
    const codigo = await gerarCodigoUnico(dados.prefixo);
    const sufixo = codigo.slice(codigo.indexOf('-') + 1).toLowerCase();
    const slug = `${slugify(dados.nomeOrg) || 'org'}-${sufixo}`;

    // Criação é cross-tenant por natureza (a org ainda não existe, logo não há
    // `app.current_org`): roda em bypass do RLS numa transação de sistema.
    return withBypass(async (client) => {
        const org = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano)
             VALUES ($1, $2, $3, 'free') RETURNING *`,
            [dados.nomeOrg, codigo, slug],
        )).rows[0];

        // O criador da org nasce como Administrador no eixo organizacional (spec 02).
        const membro = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
             VALUES ($1, $2, $3, $4, 'admin', 'administrador', NULL, $5, $6) RETURNING *`,
            [dados.nome, dados.telefone, dados.instrumentos, dados.email, dados.senhaHash, org.id],
        )).rows[0];

        await client.query('UPDATE organizacoes SET criado_por = $1 WHERE id = $2', [membro.id, org.id]);

        return { org: { ...org, criado_por: membro.id }, membro };
    });
}
