/**
 * Extrai o ID do vídeo de um link do YouTube (spec 08) — usado no preview antes de salvar.
 * O backend valida/extrai de novo (fonte da verdade); aqui é só pra UX.
 */
const PADROES = [
  /[?&]v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
];

export function extrairVideoIdYoutube(url: string): string | null {
  if (!url) {
    return null;
  }
  const texto = url.trim();
  for (const padrao of PADROES) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      return match[1];
    }
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) {
    return texto;
  }
  return null;
}

/**
 * Busca o título de um vídeo do YouTube via oEmbed (público, sem precisar de API key).
 * `null` se o link não for do YouTube ou a busca falhar — quem chama decide o que fazer
 * (ex.: não preencher o nome automaticamente e deixar o usuário digitar).
 */
export async function buscarTituloYoutube(url: string): Promise<string | null> {
  const id = extrairVideoIdYoutube(url);
  if (!id) {
    return null;
  }
  try {
    const resposta = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
    );
    if (!resposta.ok) {
      return null;
    }
    const dados = await resposta.json();
    return typeof dados.title === 'string' ? dados.title : null;
  } catch {
    return null;
  }
}
