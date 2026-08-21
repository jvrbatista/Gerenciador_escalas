/** Formata uma data/hora pra mensagem de notificação/e-mail: "23/08 19:00" (sem ano, sem timezone por extenso). */
export function formatarDataHoraCurta(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo',
    }).format(data).replace(',', '');
}
