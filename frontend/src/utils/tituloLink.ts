import { buscarTituloYoutube } from './youtube';

async function buscarTituloOembed(oembedUrl: string): Promise<string | null> {
  try {
    const resposta = await fetch(oembedUrl);
    if (!resposta.ok) {
      return null;
    }
    const dados = await resposta.json();
    return typeof dados.title === 'string' ? dados.title : null;
  } catch {
    return null;
  }
}

/**
 * Busca o título de uma música a partir do link colado — tenta YouTube primeiro,
 * depois Spotify, ambos via oEmbed público (sem precisar de API key). `null` se o
 * link não for de nenhum dos dois ou a busca falhar.
 */
export async function buscarTituloDoLink(url: string): Promise<string | null> {
  const texto = url.trim();
  if (!texto) {
    return null;
  }

  const doYoutube = await buscarTituloYoutube(texto);
  if (doYoutube) {
    return doYoutube;
  }

  if (/open\.spotify\.com/i.test(texto)) {
    return buscarTituloOembed(`https://open.spotify.com/oembed?url=${encodeURIComponent(texto)}`);
  }

  return null;
}
