import { Request, Response } from 'express';
import { createEscalaVocal, sugerirVocais, findEscalaVocalById, updateStatusEscalaVocal, findEscalaVocalByCultoId, findMinhaEscalaVocal, deleteEscalaVocal } from '../models/escalaVocalModel';
import { findById, findAdminsAtivos } from '../models/membroModel';
import { findCultoById } from '../models/cultoModel';
import { createNotificacao } from '../models/notificacaoModel';
import { enviarEmail } from '../services/emailService';
import { formatarDataHoraCurta } from '../utils/data';

export async function createEscalaVocalController(req: Request, res: Response) {
    try {
        const { membroId, cultoId } = req.body;

    if (!membroId || !cultoId) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }

    await createEscalaVocal(membroId, cultoId);
    const membro = await findById(membroId)
    const culto = await findCultoById(cultoId)
    if (membro && culto) {
        try {
            await enviarEmail(
            membro.email,
            'Você foi escalado para um culto!',
            `Olá ${membro.nome}, você foi escalado para um culto no dia ${formatarDataHoraCurta(culto.data_hora)}.`
        );
        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
        try {
            await createNotificacao(
                membroId,
                'escala',
                'Nova escala publicada',
                `Você foi escalado para o culto do dia ${formatarDataHoraCurta(culto.data_hora)}.`
            );
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }
    return res.status(201).json({ message: 'Escala vocal cadastrada com sucesso!' })

    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function sugerirVocaisController(req: Request, res: Response) {
    try {
    const cultoId = Number(req.query.cultoId)
    if (!cultoId) {
        return res.status(400).json({ message: 'cultoId é obrigatório!' })
    }

    const vocais = await sugerirVocais(2, cultoId)
    return res.status(200).json({message: 'Sugestão de vocais encontrada com sucesso!', vocais})
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function confirmarPresencaController (req: Request, res: Response) {
    const { id } = req.params
    const { status } = req.body

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!'})
    }


    if (!id || !status) {
        return res.status(400).json({ message: 'Dados inválidos!'})
    }

    const escalaVocal = await findEscalaVocalById(Number(id))

    if (!escalaVocal) {
        return res.status(404).json({ message: 'Escala vocal não encontrada!'})
    }

    if (req.user.id !== escalaVocal.membro_id) {
        return res.status(403 ).json({ message: 'Não autorizado!'})
    }

    await updateStatusEscalaVocal(Number(id), status);

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

    return res.status(200).json({message: 'Escala vocal atualizada com sucesso!'})
}

export async function getEscalaVocalDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;

    const escalaVocal = await findEscalaVocalByCultoId(Number(cultoId));

    return res.status(200).json(escalaVocal);
}

export async function getMinhaEscalaVocalController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }
    const escalaVocal = await findMinhaEscalaVocal(req.user.id);
    return res.status(200).json(escalaVocal);
}

export async function deleteEscalaVocalController(req: Request, res: Response) {
    const { id } = req.params;

    const escalaVocal = await findEscalaVocalById(Number(id));
    if (!escalaVocal) {
        return res.status(404).json({ message: 'Escala vocal não encontrada!' })
    }

    await deleteEscalaVocal(Number(id));
    return res.status(200).json({ message: 'Escala vocal removida com sucesso!' })
}