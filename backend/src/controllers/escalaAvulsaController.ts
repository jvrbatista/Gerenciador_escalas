import { Request, Response } from 'express';
import { createEscalaAvulsa, findEscalaAvulsaByCultoId, findEscalaAvulsaById, updateStatusEscalaAvulsa, findMinhaEscalaAvulsa, deleteEscalaAvulsa } from '../models/escalaAvulsaModel';
import { findById, findAdminsAtivos } from '../models/membroModel';
import { findCultoById } from '../models/cultoModel';
import { createNotificacao } from '../models/notificacaoModel';
import { enviarEmail } from '../services/emailService';
import { formatarDataHoraCurta } from '../utils/data';

export async function createEscalaAvulsaController(req: Request, res: Response) {
    try {
        const { membroId, cultoId, funcao } = req.body;

        if (!membroId || !cultoId || !funcao) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        await createEscalaAvulsa(membroId, cultoId, funcao);

        const membro = await findById(membroId)
        const culto = await findCultoById(cultoId)
        if (membro && culto) {
            try {
                await enviarEmail(
                    membro.email,
                    'Você foi escalado para um culto!',
                    `Olá ${membro.nome}, você foi escalado como "${funcao}" para o culto do dia ${formatarDataHoraCurta(culto.data_hora)}.`
                );
            } catch (error) {
                console.error('Erro ao enviar email:', error);
            }
            try {
                await createNotificacao(
                    membroId,
                    'escala',
                    'Nova escala publicada',
                    `Você foi escalado como "${funcao}" para o culto do dia ${formatarDataHoraCurta(culto.data_hora)}.`
                );
            } catch (error) {
                console.error('Erro ao criar notificação:', error);
            }
        }

        return res.status(201).json({ message: 'Escala avulsa cadastrada com sucesso!' })
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!' })
    }
}

export async function getEscalaAvulsaDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;
    const escalaAvulsa = await findEscalaAvulsaByCultoId(Number(cultoId));
    return res.status(200).json(escalaAvulsa);
}

export async function confirmarPresencaAvulsaController(req: Request, res: Response) {
    const { id } = req.params
    const { status } = req.body

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }

    if (!id || !status) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }

    const escalaAvulsa = await findEscalaAvulsaById(Number(id))

    if (!escalaAvulsa) {
        return res.status(404).json({ message: 'Escala avulsa não encontrada!' })
    }

    if (req.user.id !== escalaAvulsa.membro_id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }

    await updateStatusEscalaAvulsa(Number(id), status);

    if (status === 'confirmado') {
        try {
            const membro = await findById(req.user.id);
            const admins = await findAdminsAtivos();
            for (const admin of admins) {
                await createNotificacao(
                    admin.id,
                    'confirmacao',
                    'Confirmação recebida',
                    `${membro?.nome ?? 'Um membro'} confirmou presença.`
                );
            }
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }

    return res.status(200).json({ message: 'Escala avulsa atualizada com sucesso!' })
}

export async function getMinhaEscalaAvulsaController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }
    const escalaAvulsa = await findMinhaEscalaAvulsa(req.user.id);
    return res.status(200).json(escalaAvulsa);
}

export async function deleteEscalaAvulsaController(req: Request, res: Response) {
    const { id } = req.params;

    const escalaAvulsa = await findEscalaAvulsaById(Number(id));
    if (!escalaAvulsa) {
        return res.status(404).json({ message: 'Escala avulsa não encontrada!' })
    }

    await deleteEscalaAvulsa(Number(id));
    return res.status(200).json({ message: 'Escala avulsa removida com sucesso!' })
}