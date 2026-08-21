/**
 * Passo 8 — testes de segurança por endpoint (Fase A, specs 01/02).
 *
 * Sobe o app real (supertest) contra o banco com RLS e cobre, endpoint a endpoint:
 *   • AUTORIZAÇÃO (Passo 5): membro comum recebe 403 em ações de admin/gestão.
 *   • ISOLAMENTO (Passo 4): org A não lê/edita/apaga nada da org B (404/vazio).
 *
 * Integração real: precisa do banco com as migrations aplicadas e do app conectando
 * como `deepscales_app` (não-superusuário). Pula (sem falhar) se o banco estiver
 * indisponível ou a conexão for superusuária (que ignora RLS).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../app';
import { pool, withBypass } from '../config/database';

let pular = false;
// Um servidor persistente (não um efêmero por request) — evita flakiness de
// handshake do supertest sob rajada de chamadas.
let server: Server;
const http = () => request(server);
const tag = `sec-test-${process.pid}`;

interface OrgSeed {
    orgId: number;
    adminId: number;
    adminEmail: string;
    vocalId: number;
    cultoId: number;
}

const A = {} as OrgSeed;
const B = {} as OrgSeed;
const tokens = { adminA: '', vocalA: '', adminB: '' };

async function semearOrg(nome: string, sufixo: string, senhaHash: string): Promise<OrgSeed> {
    return withBypass(async (client) => {
        const org = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano) VALUES ($1, $2, $3, 'free') RETURNING id`,
            [nome, `${sufixo}-${tag}`, `${sufixo}-${tag}`.toLowerCase()],
        )).rows[0];

        const admin = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
             VALUES ($1, '000', ARRAY['Violão'], $2, 'admin', 'administrador', NULL, $3, $4) RETURNING id`,
            [`Admin ${nome}`, `admin-${sufixo}-${tag}@t.local`, senhaHash, org.id],
        )).rows[0];

        const vocal = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
             VALUES ($1, '000', ARRAY['Vocal'], $2, 'vocal', 'membro', 'vocal', $3, $4) RETURNING id`,
            [`Vocal ${nome}`, `vocal-${sufixo}-${tag}@t.local`, senhaHash, org.id],
        )).rows[0];

        const culto = (await client.query(
            `INSERT INTO cultos (data_hora, tipo, org_id) VALUES (NOW(), $1, $2) RETURNING id`,
            [`Culto ${nome}`, org.id],
        )).rows[0];

        await client.query(
            `INSERT INTO repertorio (culto_id, nome, tom, link_musica, org_id) VALUES ($1, 'Musica', 'G', 'http://x', $2)`,
            [culto.id, org.id],
        );

        return {
            orgId: org.id,
            adminId: admin.id,
            adminEmail: `admin-${sufixo}-${tag}@t.local`,
            vocalId: vocal.id,
            cultoId: culto.id,
        };
    });
}

async function login(email: string): Promise<string> {
    const res = await http().post('/membros/login').send({ email, passwordUser: 'senha123' });
    return res.body.token;
}

const auth = (token: string) => `Bearer ${token}`;

beforeAll(async () => {
    try {
        const { rows } = await pool.query("SELECT current_setting('is_superuser') AS su");
        if (rows[0].su === 'on') {
            pular = true;
            return;
        }
    } catch {
        pular = true;
        return;
    }

    server = app.listen(0);
    const senhaHash = await bcrypt.hash('senha123', 10);
    Object.assign(A, await semearOrg('OrgA', 'AAA', senhaHash));
    Object.assign(B, await semearOrg('OrgB', 'BBB', senhaHash));

    tokens.adminA = await login(A.adminEmail);
    tokens.vocalA = await login(`vocal-AAA-${tag}@t.local`);
    tokens.adminB = await login(B.adminEmail);
});

afterAll(async () => {
    if (!pular && A.orgId && B.orgId) {
        const orgs = [A.orgId, B.orgId];
        await withBypass(async (client) => {
            await client.query('DELETE FROM repertorio WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM escala_fixa WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM cultos WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM membros WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM organizacoes WHERE id = ANY($1)', [orgs]);
        });
    }
    if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await pool.end();
});

// Endpoints de admin/gestão: um membro comum (vocal) deve receber 403 em TODOS.
// Ids inexistentes de propósito (a autorização roda ANTES do controller, então
// não há efeito colateral nem risco de apagar dado semeado).
const ACOES_RESTRITAS: { m: 'post' | 'get' | 'delete'; path: string }[] = [
    { m: 'post', path: '/cultos' },
    { m: 'delete', path: '/cultos/999999' },
    { m: 'post', path: '/membros/cadastro' },
    { m: 'get', path: '/membros' },
    { m: 'delete', path: '/membros/999999' },
    { m: 'post', path: '/escala-fixa' },
    { m: 'get', path: '/escala-fixa' },
    { m: 'delete', path: '/escala-fixa/999999' },
    { m: 'post', path: '/escala-vocal' },
    { m: 'get', path: '/escala-vocal/sugestao' },
    { m: 'delete', path: '/escala-vocal/999999' },
    { m: 'post', path: '/escala-avulsa' },
    { m: 'delete', path: '/escala-avulsa/999999' },
    { m: 'post', path: '/repertorio' },
    { m: 'delete', path: '/repertorio/999999' },
];

describe('Autorização por capacidade (Passo 5)', () => {
    it.each(ACOES_RESTRITAS)('vocal (membro) recebe 403 em $m $path', async (acao) => {
        if (pular) return;
        const res = await http()[acao.m](acao.path).set('Authorization', auth(tokens.vocalA)).send({});
        expect(res.status).toBe(403);
    });

    it('admin NÃO é bloqueado nas leituras de gestão (200)', async () => {
        if (pular) return;
        const membros = await http().get('/membros').set('Authorization', auth(tokens.adminA));
        const fixa = await http().get('/escala-fixa').set('Authorization', auth(tokens.adminA));
        expect(membros.status).toBe(200);
        expect(fixa.status).toBe(200);
    });

    it('membro comum acessa o que é próprio (GET /membros/me e GET /cultos = 200)', async () => {
        if (pular) return;
        const me = await http().get('/membros/me').set('Authorization', auth(tokens.vocalA));
        const cultos = await http().get('/cultos').set('Authorization', auth(tokens.vocalA));
        expect(me.status).toBe(200);
        expect(cultos.status).toBe(200);
    });
});

describe('Isolamento entre organizações (Passo 4)', () => {
    it('GET /cultos só traz os cultos da própria org', async () => {
        if (pular) return;
        const res = await http().get('/cultos').set('Authorization', auth(tokens.adminA));
        const ids = res.body.map((c: { id: number }) => c.id);
        expect(ids).toContain(A.cultoId);
        expect(ids).not.toContain(B.cultoId);
    });

    it('A não lê um culto da B por id direto → 404', async () => {
        if (pular) return;
        const res = await http().get(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(res.status).toBe(404);
    });

    it('A não apaga um culto da B (404) e o culto da B continua existindo', async () => {
        if (pular) return;
        const del = await http().delete(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(del.status).toBe(404);
        const aindaExiste = await http().get(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminB));
        expect(aindaExiste.status).toBe(200);
    });

    it('GET /membros da A não inclui membros da B', async () => {
        if (pular) return;
        const res = await http().get('/membros').set('Authorization', auth(tokens.adminA));
        const ids = res.body.map((m: { id: number }) => m.id);
        expect(ids).toContain(A.adminId);
        expect(ids).not.toContain(B.adminId);
        expect(ids).not.toContain(B.vocalId);
    });

    it('A não lê um membro da B por id (corpo não traz o membro da B)', async () => {
        if (pular) return;
        const res = await http().get(`/membros/${B.adminId}`).set('Authorization', auth(tokens.adminA));
        expect(res.body?.id).toBeUndefined();
    });

    it('A não enxerga o repertório de um culto da B (lista vazia)', async () => {
        if (pular) return;
        const res = await http().get(`/repertorio/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(Array.isArray(res.body) ? res.body.length : 0).toBe(0);
    });
});
