import { getApiUrl } from "./config";
import type { Documento } from "./documento";
import { PortalRequester } from "./eventoDocumentoRequest";

export interface DocumentoPage {
    content: Documento[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

let requester: PortalRequester | null = null;

function getRequester(): PortalRequester {
    if (!requester) {
        requester = new PortalRequester(`${getApiUrl()}/api/v1/documentos`);
    }
    return requester;
}

export async function getDocumentosAtivos(page: number = 0, size: number = 100, q?: string, categoria?: string): Promise<DocumentoPage> {
    return getRequester().fetchAtivos(page, size, "id,desc", q, categoria);
}
