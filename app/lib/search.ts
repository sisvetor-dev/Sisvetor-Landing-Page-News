import type { Documento } from "./api/documento";
import type { CategoriaVetor } from "./api/enum";
import type { Evento } from "./api/evento";
import type { Arquivo, Noticia, NoticiaTag } from "./api/noticia";

/**
 * Busca global do portal (notícias, eventos e documentos).
 *
 * A filtragem por termo acontece no backend (parâmetro `q` do endpoint `/ativo` de cada tipo,
 * com OU entre os campos de texto) — carregar tudo para filtrar no cliente não escala à medida
 * que o volume de registros cresce. Este módulo só normaliza cada tipo para um formato comum,
 * usado pela página de busca para renderizar os resultados já filtrados pelo servidor.
 */
export type TipoResultadoBusca = "noticia" | "evento" | "documento";

export interface ResultadoBusca {
    tipo: TipoResultadoBusca;
    id: number;
    titulo: string;
    resumo: string;
    href: string;
    /** Já formatada para exibição — noticia/documento usam data-hora, evento usa LocalDate. */
    dataExibicao: string;
    /** Valor bruto (ISO), só para ordenar por mais recente. */
    dataOrdenacao?: string;
    categoriaVetor?: CategoriaVetor;
    tags: NoticiaTag[];
    imagem?: Arquivo;
}

/** Datas no formato "AAAA-MM-DD" (LocalDate do backend, usado em Evento.dataInicio). Monta a
 * data manualmente para não sofrer deslocamento de fuso horário (ver eventos.tsx). */
function formatarDataLocal(data?: string): string {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-").map(Number);
    if (!ano || !mes || !dia) return "";
    return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/** Datas ISO com hora (createdAt), onde o parse padrão do Date já é seguro. */
function formatarDataHora(data?: string): string {
    if (!data) return "";
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function noticiaParaResultado(noticia: Noticia): ResultadoBusca {
    return {
        tipo: "noticia",
        id: noticia.id,
        titulo: noticia.titulo,
        resumo: noticia.resumo,
        href: `/noticias/${noticia.caminhoURL}`,
        dataExibicao: formatarDataHora(noticia.createdAt),
        dataOrdenacao: noticia.createdAt,
        categoriaVetor: noticia.categoriaVetor,
        tags: noticia.tags ?? [],
        imagem: noticia.imagemDestaque,
    };
}

export function eventoParaResultado(evento: Evento): ResultadoBusca {
    return {
        tipo: "evento",
        id: evento.id,
        titulo: evento.nome,
        resumo: evento.descricao,
        href: `/eventos/${evento.caminhoURL}`,
        dataExibicao: formatarDataLocal(evento.dataInicio),
        dataOrdenacao: evento.dataInicio,
        categoriaVetor: evento.categoriaVetor,
        tags: evento.tags ?? [],
        imagem: evento.imagemDestaque,
    };
}

export function documentoParaResultado(documento: Documento): ResultadoBusca {
    return {
        tipo: "documento",
        id: documento.id,
        titulo: documento.titulo,
        resumo: documento.resumo,
        href: `/documentos/${documento.caminhoURL}`,
        dataExibicao: formatarDataHora(documento.createdAt),
        dataOrdenacao: documento.createdAt,
        categoriaVetor: documento.categoriaVetor,
        tags: documento.tags ?? [],
    };
}

export function ordenarPorMaisRecente(a: ResultadoBusca, b: ResultadoBusca): number {
    const tempo = (r: ResultadoBusca) => (r.dataOrdenacao ? new Date(r.dataOrdenacao).getTime() : 0);
    return tempo(b) - tempo(a) || b.id - a.id;
}
