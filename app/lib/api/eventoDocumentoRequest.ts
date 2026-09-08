/**
 * Acesso aos endpoints públicos de eventos e documentos.
 *
 * Mesmo formato do NoticiaRequester: paginação do Spring e filtro de ativos feito no backend
 * (`/ativo`). A URL base é resolvida em runtime — ver `config.ts`.
 */
export class PortalRequester {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async fetchAtivos(page: number = 0, size: number = 20, sort: string = "id,desc", q?: string, categoria?: string) {
        const params = new URLSearchParams({
            page: String(page),
            size: String(size),
            sort
        });
        if (q) {
            params.set("q", q);
        }
        if (categoria) {
            params.set("categoria", categoria);
        }

        const response = await fetch(`${this.baseUrl}/ativo?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar dados em ${this.baseUrl}: ${response.statusText}`);
        }

        return response.json();
    }
}
