import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { Request, Response } from 'express';
import { createMembers, deactivateMember } from '../models/membroModel';
import { findByEmail, findById, findAllMembers, updateMember, findByIdComSenha, updatePassword } from '../models/membroModel';
import { assinarTokenMembro, assinarTokenResetSenha, verificarTokenResetSenha } from '../utils/token';
import { podeAcessar, mesmoUsuario, PapelOrg, PapelMinisterio } from '../config/capacidades';
import { enviarEmail } from '../services/emailService';


export async function cadastrarUser(req: Request, res: Response) {
    const {name, email, passwordUser, papelOrg, papelMinisterio, instruments, phone} = req.body

    if (!req.orgId) {
        return res.status(401).json({message: 'Não autenticado!'})
    }

    const emailDuplicate = await query('SELECT * FROM membros WHERE email = $1', [email])
    if (emailDuplicate.rows.length > 0) {
        return res.status(400).json({message: 'Email duplicado'})
    }


    const hashPassword = await bcrypt.hash(passwordUser, 10)

    // Novo membro nasce na organização do admin que o cadastra.
    await createMembers (name, phone, instruments ?? [], email, (papelOrg as PapelOrg) ?? 'membro', (papelMinisterio as PapelMinisterio) ?? null, hashPassword, req.orgId);

    return res.status(201).json({message: 'Usuario cadastrado com sucesso!'})
}

export async function loginUser(req: Request, res: Response) {
    const {email, passwordUser} = req.body

    const membro = await findByEmail(email) 
        if (!membro) {
        return res.status(400).json({message: 'Credenciais inválidas!'})
}
    const passwordCorrect = await bcrypt.compare(passwordUser, membro.senha)
        if (!passwordCorrect) {
            return res.status(400).json({message: 'Credenciais inválidas!'})
        }

        const token = assinarTokenMembro({
            id: membro.id,
            papel: membro.papel,
            papel_org: membro.papel_org,
            papel_ministerio: membro.papel_ministerio,
            org_id: membro.org_id,
        })

        return res.status(200).json({ token, message: 'Login realizado com sucesso!'})
        
}

export async function myProfile(req: Request, res: Response) {
    if (!req.user) {
        throw new Error('req.user não configurado!')
    }

    const { id } = req.user
    
    const membro = await findById(id)

    return res.status(200).json(membro)
} 

export async function listAllMembers(req: Request, res: Response) {
    const membros = await findAllMembers();
    return res.status(200).json(membros);
}

export async function getMemberById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({message: 'Id inválido!'})
    }

    if (!req.user) {
        return res.status(401).json({message: 'Não autenticado!'})
    }

    // Admin/ministro (via capacidade) ou o próprio membro (via ownership).
    const usuario = { papelOrg: req.user.papel_org, papelMinisterio: req.user.papel_ministerio ?? null };
    if (!podeAcessar(usuario, 'membro.visualizar') && !mesmoUsuario(id, req.user.id)) {
        return res.status(403).json({message: 'Não autorizado!'})
    }

    const membro = await findById(id)
    return res.status(200).json(membro);
}

export async function updateMemberController (req: Request, res: Response) {
    const id = Number(req.params.id);
    const {name, phone, instruments, email, papelOrg, papelMinisterio} = req.body;

    if ( !req.user ) {
        return res.status(401).json({message: 'Não autenticado!'})
    }

    const usuario = { papelOrg: req.user.papel_org, papelMinisterio: req.user.papel_ministerio ?? null };

    // Admin (via capacidade) ou o próprio membro (via ownership).
    if ( !podeAcessar(usuario, 'membro.editar') && !mesmoUsuario(id, req.user.id) ) {
        return res.status(403).json({message: 'Não autorizado!'})
    }

    // Alterar o papel (organização OU ministério) é exclusivo de quem tem a
    // capacidade (administrador) — os dois eixos são decisões deliberadas, não
    // algo que se deriva de outro campo (ex.: instrumentos).
    if ((papelOrg || papelMinisterio !== undefined) && !podeAcessar(usuario, 'membro.papel.alterar')) {
        return res.status(403).json({message: 'Só admin pode alterar o papel!'})
    }

    if (email) {
        const emailExists = await findByEmail(email);
        if (emailExists && emailExists.id !== id) {
            return res.status(400).json({message: 'Email já cadastrado!'})
        }
    }

    if (!name || !phone || !instruments || instruments.length === 0 || !email) {
        return res.status(400).json({message: 'Todos os campos devem ser preechidos!'})
    }

    // Papel na organização/ministério: o novo (se quem edita pode alterá-lo) ou o
    // atual do membro (senão — ex.: a própria pessoa só editando os instrumentos).
    // `papelMinisterio === undefined` = campo nem veio no corpo (não mexeu nele);
    // `null` é um valor válido (explicitamente "nenhum").
    let papelOrgEfetivo: PapelOrg = papelOrg;
    let papelMinisterioEfetivo: PapelMinisterio | null = papelMinisterio ?? null;
    if (!papelOrgEfetivo || papelMinisterio === undefined) {
        const atual = await findById(id);
        if (!atual) {
            return res.status(404).json({message: 'Membro não encontrado!'})
        }
        if (!papelOrgEfetivo) {
            papelOrgEfetivo = atual.papel_org;
        }
        if (papelMinisterio === undefined) {
            papelMinisterioEfetivo = atual.papel_ministerio ?? null;
        }
    }

    await updateMember(id, name, phone, instruments, email, papelOrgEfetivo, papelMinisterioEfetivo);

    return res.status(200).json({message: 'Alterações realizadas com sucesso!'})
}

export async function deactivateMemberController(req: Request, res: Response) {
    const id = Number(req.params.id);
    await deactivateMember(id, false)
    return res.status(200).json({message: 'Membro desativado com sucesso!'})
}

export async function esqueciSenhaController(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Informe o e-mail!' });
    }

    const membro = await findByEmail(email);

    // Não revela se o e-mail existe ou não (evita enumeração de contas) — a
    // resposta é sempre a mesma, o e-mail só sai se o membro existir de fato.
    if (membro) {
        const token = assinarTokenResetSenha(membro.id);
        const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;
        await enviarEmail(
            membro.email,
            'Redefinir senha — Deep Scales',
            `<p>Olá, ${membro.nome}!</p>
             <p>Clique no link abaixo para escolher uma nova senha. Ele vale por 30 minutos:</p>
             <p><a href="${link}">${link}</a></p>
             <p>Se você não pediu isso, pode ignorar este e-mail.</p>`,
        );
    }

    return res.status(200).json({ message: 'Se o e-mail existir, enviamos um link de redefinição.' });
}

export async function redefinirSenhaController(req: Request, res: Response) {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
        return res.status(400).json({ message: 'Informe o token e a nova senha!' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres!' });
    }

    let dados;
    try {
        dados = verificarTokenResetSenha(token);
    } catch {
        return res.status(400).json({ message: 'Link inválido ou expirado. Peça um novo.' });
    }

    const hashPassword = await bcrypt.hash(novaSenha, 10);
    await updatePassword(dados.id, hashPassword);

    return res.status(200).json({ message: 'Senha redefinida com sucesso!' });
}

export async function updatePasswordController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { senhaAtual, novaSenha } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado!' })
    }

    if (req.user.id !== id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ message: 'Informe a senha atual e a nova senha!' })
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres!' })
    }

    const membro = await findByIdComSenha(id);
    if (!membro) {
        return res.status(404).json({ message: 'Membro não encontrado!' })
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, membro.senha);
    if (!senhaCorreta) {
        return res.status(400).json({ message: 'Senha atual incorreta!' })
    }

    const hashPassword = await bcrypt.hash(novaSenha, 10);
    await updatePassword(id, hashPassword);

    return res.status(200).json({ message: 'Senha alterada com sucesso!' })
}