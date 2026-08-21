import type { PapelOrg, PapelMinisterio } from '../config/capacidades';

/**
 * Deriva os dois eixos de papel (spec 02, D-02.3) a partir do papel legado
 * (`admin` | `ministro` | `vocal` | `membro`). Fonte única do mapeamento —
 * a migration de RBAC faz o mesmo backfill para os dados existentes.
 *
 *   admin    → org: administrador · ministerio: null
 *   ministro → org: membro        · ministerio: ministro
 *   vocal    → org: membro        · ministerio: vocal
 *   membro   → org: membro        · ministerio: null
 */
export function derivarPapeis(papelLegado: string): {
    papelOrg: PapelOrg;
    papelMinisterio: PapelMinisterio | null;
} {
    if (papelLegado === 'admin') {
        return { papelOrg: 'administrador', papelMinisterio: null };
    }
    if (papelLegado === 'ministro') {
        return { papelOrg: 'membro', papelMinisterio: 'ministro' };
    }
    if (papelLegado === 'vocal') {
        return { papelOrg: 'membro', papelMinisterio: 'vocal' };
    }
    return { papelOrg: 'membro', papelMinisterio: null };
}

/**
 * Caminho inverso de `derivarPapeis` — agora que o cadastro/edição escolhe os dois
 * eixos direto (seletores próprios pra papelOrg e papelMinisterio, sem derivar um
 * do outro nem de outro campo), a coluna legada `papel` deixa de ser escolhida e
 * passa a ser só um reflexo best-effort dos dois eixos reais (ainda usada em 2
 * lugares: filtro de sugestão de vocal e busca de admins ativos — por isso o
 * mapeamento cobre esses casos com exatidão; combinações sem equivalente legado
 * (líder/instrumentista) caem em 'membro', que é inofensivo pros dois usos reais).
 */
export function derivarPapelLegado(papelOrg: PapelOrg, papelMinisterio: PapelMinisterio | null): string {
    if (papelOrg === 'administrador') {
        return 'admin';
    }
    if (papelMinisterio === 'ministro') {
        return 'ministro';
    }
    if (papelMinisterio === 'vocal') {
        return 'vocal';
    }
    return 'membro';
}
