export class NoticiaRequester {
    private baseUrl: string;

    constructor(baseUrl: string = '/api/noticias') {
        this.baseUrl = baseUrl;
    }

    async fetchNoticiasAtivas(page: number = 0, size: number = 20, q?: string, categoria?: string) {
        const params = new URLSearchParams({
            page: String(page),
            size: String(size),
            sort: 'id,desc',
        });
        if (q) {
            params.set('q', q);
        }
        if (categoria) {
            params.set('categoria', categoria);
        }

        const response = await fetch(`${this.baseUrl}/ativo?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Erro ao buscar notícias ativas: ${response.statusText}`);
        }
        return response.json();
    }
}
