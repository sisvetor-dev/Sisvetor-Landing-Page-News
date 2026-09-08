import type { NoticiaPage } from './noticia';
import { NoticiaRequester } from './noticiaRequest';
import { getApiUrl } from './config';

// Resolvido na primeira chamada, não na carga do módulo: garante que window.ENV (injetado pelo
// loader do root) já esteja disponível quando a URL base for montada.
let noticiaRequester: NoticiaRequester | null = null;

function getNoticiaRequester(): NoticiaRequester {
    if (!noticiaRequester) {
        noticiaRequester = new NoticiaRequester(`${getApiUrl()}/api/v1/noticias`);
    }
    return noticiaRequester;
}

export async function getNoticiasAtivas(page: number = 0, size: number = 20, q?: string, categoria?: string): Promise<NoticiaPage> {
    return getNoticiaRequester().fetchNoticiasAtivas(page, size, q, categoria);
}
