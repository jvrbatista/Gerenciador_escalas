import jwt from 'jsonwebtoken';
import type { PapelOrg, PapelMinisterio } from '../config/capacidades';

export interface DadosTokenMembro {
    id: number;
    papel: string;                              // legado (compat) — ver spec 02
    papel_org: PapelOrg;                        // eixo organizacional (permissões)
    papel_ministerio: PapelMinisterio | null;   // eixo musical (escalas)
    org_id: number;
}

/**
 * Assina o JWT de sessão do membro. Inclui `org_id` (isolamento multi-tenant,
 * spec 01) e os dois eixos de papel (`papel_org` / `papel_ministerio`, spec 02)
 * para autorizar por capacidade sem consultar o banco a cada request.
 */
export function assinarTokenMembro(membro: DadosTokenMembro): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }
    return jwt.sign(
        {
            id: membro.id,
            papel: membro.papel,
            papel_org: membro.papel_org,
            papel_ministerio: membro.papel_ministerio,
            org_id: membro.org_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
    );
}

/**
 * Token de redefinição de senha ("esqueci minha senha") — curta duração e uma
 * `finalidade` própria, pra não poder ser reaproveitado como token de sessão.
 */
export function assinarTokenResetSenha(membroId: number): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }
    return jwt.sign(
        { id: membroId, finalidade: 'reset-senha' },
        process.env.JWT_SECRET,
        { expiresIn: '30m' },
    );
}

/** Valida o token de reset e devolve o id do membro. Lança se inválido/expirado/errado. */
export function verificarTokenResetSenha(token: string): { id: number } {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== 'object' || payload.finalidade !== 'reset-senha' || typeof payload.id !== 'number') {
        throw new Error('Token inválido');
    }
    return { id: payload.id };
}
