import { getApiUrl } from "./config";
import type { Evento } from "./evento";
import { PortalRequester } from "./eventoDocumentoRequest";

export interface EventoPage {
    content: Evento[];
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
        requester = new PortalRequester(`${getApiUrl()}/api/v1/eventos`);
    }
    return requester;
}

export async function getEventosAtivos(page: number = 0, size: number = 100, q?: string, categoria?: string): Promise<EventoPage> {
    // Ordena pela data de início para a home poder mostrar os próximos eventos.
    return getRequester().fetchAtivos(page, size, "dataInicio,asc", q, categoria);
}
