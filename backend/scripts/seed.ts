/**
 * Seed de desenvolvimento — popula o banco com dados de exemplo para testar.
 *
 * Uso: npm run seed   (após `npm run migrate:up`)
 *
 * Idempotente: se já houver membros, não faz nada (evita duplicar).
 * Multi-tenant: anexa tudo à organização "seed" criada pela migration
 * (slug = 'igreja-seed'), já que org_id é NOT NULL.
 * Login criado: admin@dev.local / senha123
 */
import bcrypt from 'bcrypt';
import { pool, unscopedQuery as query } from '../src/config/database';
// Seed é provisionamento de sistema: roda em bypass do RLS (não há org na sessão).
// O alias mantém as chamadas `query(...)` abaixo legíveis.

async function seed() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM membros');
    if (rows[0].n > 0) {
        console.log('ℹ️  Banco já contém membros — seed ignorado (idempotente).');
        return;
    }

    const org = (await query(
        `SELECT id FROM organizacoes WHERE slug = 'igreja-seed'`,
    )).rows[0];
    if (!org) {
        throw new Error(
            "Organização seed não encontrada (slug 'igreja-seed'). Rode `npm run migrate:up` antes do seed.",
        );
    }
    const orgId = org.id;

    const senha = await bcrypt.hash('senha123', 10);

    const admin = (await query(
        `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
         VALUES ($1, $2, $3, $4, 'admin', 'administrador', NULL, $5, $6) RETURNING id`,
        ['Admin Dev', '11999990000', ['Violão'], 'admin@dev.local', senha, orgId],
    )).rows[0];

    const vocal1 = (await query(
        `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
         VALUES ($1, $2, $3, $4, 'vocal', 'membro', 'vocal', $5, $6) RETURNING id`,
        ['Ana Vocal', '11999990001', ['Vocal'], 'ana@dev.local', senha, orgId],
    )).rows[0];

    const vocal2 = (await query(
        `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
         VALUES ($1, $2, $3, $4, 'vocal', 'membro', 'vocal', $5, $6) RETURNING id`,
        ['Bruno Vocal', '11999990002', ['Vocal', 'Teclado'], 'bruno@dev.local', senha, orgId],
    )).rows[0];

    // Marca o admin como criador da org seed (criado_por).
    await query(`UPDATE organizacoes SET criado_por = $1 WHERE id = $2`, [admin.id, orgId]);

    const culto = (await query(
        `INSERT INTO cultos (data_hora, tipo, org_id)
         VALUES (NOW() + INTERVAL '3 days', $1, $2) RETURNING id`,
        ['Culto de Domingo', orgId],
    )).rows[0];

    await query(
        `INSERT INTO escala_fixa (membro_id, dia_semana, funcao, org_id) VALUES ($1, $2, $3, $4)`,
        [admin.id, 'domingo', 'Violão', orgId],
    );

    await query(
        `INSERT INTO escala_vocal (membro_id, culto_id, org_id) VALUES ($1, $2, $3)`,
        [vocal1.id, culto.id, orgId],
    );

    await query(
        `INSERT INTO escala_avulsa (membro_id, culto_id, funcao, org_id) VALUES ($1, $2, $3, $4)`,
        [vocal2.id, culto.id, 'Backing vocal', orgId],
    );

    await query(
        `INSERT INTO repertorio (culto_id, nome, tom, link_musica, org_id) VALUES ($1, $2, $3, $4, $5)`,
        [culto.id, 'Grande é o Senhor', 'G', 'https://www.youtube.com/watch?v=exemplo', orgId],
    );

    await query(
        `INSERT INTO notificacoes (membro_id, tipo, titulo, descricao, org_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [vocal1.id, 'escala', 'Você foi escalado', 'Escala de vocal para o Culto de Domingo', orgId],
    );

    console.log('✅ Seed concluído.');
    console.log('   Organização: Igreja (dados existentes) — slug igreja-seed');
    console.log('   Login de teste:  admin@dev.local  /  senha123');
    console.log(`   Membros: 3 · Cultos: 1 · Escalas: fixa+vocal+avulsa · Repertório: 1`);
}

seed()
    .then(() => pool.end())
    .catch((err) => {
        console.error('❌ Erro no seed:', err);
        return pool.end().finally(() => process.exit(1));
    });
