import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
    ArrowRight,
    CalendarDays,
    FileText,
    Newspaper,
    Search as SearchIcon,
    X,
} from 'lucide-react';
import { CategoriaVetor } from '../lib/api/enum';
import { getNoticiasAtivas } from '../lib/api/noticiaController';
import { getEventosAtivos } from '../lib/api/eventoController';
import { getDocumentosAtivos } from '../lib/api/documentoController';
import {
    documentoParaResultado,
    eventoParaResultado,
    noticiaParaResultado,
    ordenarPorMaisRecente,
    type ResultadoBusca,
    type TipoResultadoBusca,
} from '../lib/search';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function meta() {
    return [
        { title: "Busca - Sisvetor" },
        { name: "description", content: "Busque notícias, eventos e documentos no Portal SisVetor" },
    ];
}

// Tamanho de página quando um tipo específico está selecionado (paginação real no backend).
const TAMANHO_PAGINA = 12;
// Quantos itens de cada tipo mostrar na aba "Todos" — é só uma prévia, não uma lista paginada
// globalmente (misturar 3 fontes independentes numa única paginação exigiria uma busca unificada
// no backend; refinar por tipo dá a lista completa e paginada de verdade).
const PREVIEW_TODOS = 5;

const CONFIG_TIPO: Record<TipoResultadoBusca, { label: string; labelPlural: string; icone: typeof Newspaper; badge: string }> = {
    noticia: { label: "Notícia", labelPlural: "Notícias", icone: Newspaper, badge: "border-sky-300 bg-sky-50 text-sky-700" },
    evento: { label: "Evento", labelPlural: "Eventos", icone: CalendarDays, badge: "border-emerald-300 bg-emerald-50 text-emerald-700" },
    documento: { label: "Documento", labelPlural: "Documentos", icone: FileText, badge: "border-indigo-300 bg-indigo-50 text-indigo-700" },
};

const CATEGORIAS: CategoriaVetor[] = [CategoriaVetor.TODOS, CategoriaVetor.DENGUE, CategoriaVetor.CHAGAS];

interface ResultadoTipo {
    content: ResultadoBusca[];
    total: number;
}

const RESULTADO_VAZIO: ResultadoTipo = { content: [], total: 0 };

/** Decide página/tamanho da busca de cada tipo: paginação real para o tipo em foco, prévia para
 * "todos", e uma busca de 1 item só para saber o total dos tipos que não estão em foco (alimenta
 * a contagem nos chips sem baixar resultados que não vão ser exibidos). */
function configBusca(tipoAlvo: TipoResultadoBusca, tipoSelecionado: TipoResultadoBusca | "todos", pagina: number) {
    if (tipoSelecionado === "todos") return { pagina: 0, tamanho: PREVIEW_TODOS };
    if (tipoSelecionado === tipoAlvo) return { pagina, tamanho: TAMANHO_PAGINA };
    return { pagina: 0, tamanho: 1 };
}

/** Tags são vocabulário livre (ao contrário de tipo/categoria), então não têm endpoint de busca
 * no backend — o filtro aqui é só sobre o que já foi carregado na tela, não sobre a base toda. */
function aplicarFiltroTag(itens: ResultadoBusca[], tag: string | null): ResultadoBusca[] {
    if (!tag) return itens;
    return itens.filter((item) => item.tags?.some((t) => t.tag === tag));
}

export default function Busca() {
    const [searchParams, setSearchParams] = useSearchParams();
    const termoUrl = searchParams.get("q") ?? "";

    const [termo, setTermo] = useState(termoUrl);
    const [termoAplicado, setTermoAplicado] = useState(termoUrl);
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoResultadoBusca | "todos">("todos");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaVetor>(CategoriaVetor.TODOS);
    const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);
    const [pagina, setPagina] = useState(0);
    const [carregando, setCarregando] = useState(false);

    const [resultadoNoticias, setResultadoNoticias] = useState<ResultadoTipo>(RESULTADO_VAZIO);
    const [resultadoEventos, setResultadoEventos] = useState<ResultadoTipo>(RESULTADO_VAZIO);
    const [resultadoDocumentos, setResultadoDocumentos] = useState<ResultadoTipo>(RESULTADO_VAZIO);

    // Uma busca vinda de fora (Header, ou link direto com ?q=) equivale a "apertar Enter" —
    // sincroniza o campo e já dispara a busca, sem esperar o usuário confirmar de novo aqui.
    useEffect(() => {
        setTermo(termoUrl);
        setTermoAplicado(termoUrl);
        setPagina(0);
        setTagSelecionada(null);
    }, [termoUrl]);

    useEffect(() => {
        let cancelado = false;

        async function buscar() {
            if (!termoAplicado.trim()) {
                setResultadoNoticias(RESULTADO_VAZIO);
                setResultadoEventos(RESULTADO_VAZIO);
                setResultadoDocumentos(RESULTADO_VAZIO);
                return;
            }

            setCarregando(true);
            try {
                const cfgNoticia = configBusca("noticia", tipoSelecionado, pagina);
                const cfgEvento = configBusca("evento", tipoSelecionado, pagina);
                const cfgDocumento = configBusca("documento", tipoSelecionado, pagina);
                const categoria =
                    categoriaSelecionada === CategoriaVetor.TODOS ? undefined : categoriaSelecionada;

                const [respNoticias, respEventos, respDocumentos] = await Promise.all([
                    getNoticiasAtivas(cfgNoticia.pagina, cfgNoticia.tamanho, termoAplicado, categoria),
                    getEventosAtivos(cfgEvento.pagina, cfgEvento.tamanho, termoAplicado, categoria),
                    getDocumentosAtivos(cfgDocumento.pagina, cfgDocumento.tamanho, termoAplicado, categoria),
                ]);

                if (cancelado) return;

                setResultadoNoticias({
                    content: respNoticias.content.map(noticiaParaResultado),
                    total: respNoticias.totalElements,
                });
                setResultadoEventos({
                    content: respEventos.content.map(eventoParaResultado),
                    total: respEventos.totalElements,
                });
                setResultadoDocumentos({
                    content: respDocumentos.content.map(documentoParaResultado),
                    total: respDocumentos.totalElements,
                });
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }

        buscar();
        return () => {
            cancelado = true;
        };
    }, [termoAplicado, tipoSelecionado, categoriaSelecionada, pagina]);

    const contagens = useMemo(
        () => ({
            todos: resultadoNoticias.total + resultadoEventos.total + resultadoDocumentos.total,
            noticia: resultadoNoticias.total,
            evento: resultadoEventos.total,
            documento: resultadoDocumentos.total,
        }),
        [resultadoNoticias, resultadoEventos, resultadoDocumentos]
    );

    // Tags são derivadas só do que está carregado na tela (ver aplicarFiltroTao) — em "Todos" isso
    // é a prévia de até 5 por tipo; num tipo específico, a página atual de até 12.
    const tagsDisponiveis = useMemo(() => {
        const tags = new Set<string>();
        [...resultadoNoticias.content, ...resultadoEventos.content, ...resultadoDocumentos.content].forEach(
            (item) => item.tags?.forEach((tag) => tags.add(tag.tag))
        );
        return Array.from(tags).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [resultadoNoticias, resultadoEventos, resultadoDocumentos]);

    const previewOrdenado = useMemo(() => {
        return [...resultadoNoticias.content, ...resultadoEventos.content, ...resultadoDocumentos.content].sort(
            ordenarPorMaisRecente
        );
    }, [resultadoNoticias, resultadoEventos, resultadoDocumentos]);

    function buscar(evento: React.FormEvent) {
        evento.preventDefault();
        const termoLimpo = termo.trim();
        setTermoAplicado(termoLimpo);
        setPagina(0);
        setTagSelecionada(null);
        setSearchParams(
            (params) => {
                if (termoLimpo) {
                    params.set("q", termoLimpo);
                } else {
                    params.delete("q");
                }
                return params;
            },
            { replace: true }
        );
    }

    function limparBusca() {
        setTermo("");
        setTermoAplicado("");
        setPagina(0);
        setTagSelecionada(null);
        setSearchParams((params) => {
            params.delete("q");
            return params;
        }, { replace: true });
    }

    function selecionarTipo(tipo: TipoResultadoBusca | "todos") {
        setTipoSelecionado(tipo);
        setPagina(0);
        setTagSelecionada(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function selecionarCategoria(categoria: CategoriaVetor) {
        setCategoriaSelecionada(categoria);
        setPagina(0);
        setTagSelecionada(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function selecionarTag(tag: string | null) {
        setTagSelecionada(tag);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function irParaPagina(novaPagina: number) {
        setPagina(novaPagina);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const termoAtivo = termoAplicado.trim().length > 0;

    const resultadoDoTipoSelecionado =
        tipoSelecionado === "noticia"
            ? resultadoNoticias
            : tipoSelecionado === "evento"
            ? resultadoEventos
            : tipoSelecionado === "documento"
            ? resultadoDocumentos
            : null;

    const totalPaginas = resultadoDoTipoSelecionado ? Math.ceil(resultadoDoTipoSelecionado.total / TAMANHO_PAGINA) : 0;

    const itensDoTipoSelecionado = resultadoDoTipoSelecionado
        ? aplicarFiltroTag(resultadoDoTipoSelecionado.content, tagSelecionada)
        : [];

    const itensNoticiasPreview = aplicarFiltroTag(resultadoNoticias.content, tagSelecionada);
    const itensEventosPreview = aplicarFiltroTag(resultadoEventos.content, tagSelecionada);
    const itensDocumentosPreview = aplicarFiltroTag(resultadoDocumentos.content, tagSelecionada);

    const previewTotalmenteVazioPorTag =
        tagSelecionada !== null &&
        contagens.todos > 0 &&
        itensNoticiasPreview.length === 0 &&
        itensEventosPreview.length === 0 &&
        itensDocumentosPreview.length === 0;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex flex-1 flex-col">
                <section className="bg-gradient-to-b from-white to-slate-50 py-10">
                    <div className="mx-auto max-w-7xl px-6">
                        {/* <span className="badge badge-neutral badge-outline w-fit">
                            Busca
                        </span> */}
                        <h1 className="mt-5 text-4xl font-bold text-slate-900">
                            Buscar no Portal SisVetor
                        </h1>
                        <p className="mt-3 max-w-2xl text-lg text-slate-600">
                            Pesquise em notícias, eventos e documentos técnicos ao mesmo tempo.
                        </p>

                        <form onSubmit={buscar} role="search" className="relative mt-6 max-w-xl">
                            <SearchIcon
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                autoFocus
                                type="text"
                                value={termo}
                                onChange={(e) => setTermo(e.target.value)}
                                placeholder="Buscar notícias, eventos, documentos... (Enter para buscar)"
                                aria-label="Buscar no portal"
                                className="input input-bordered w-full rounded-full border-2 border-slate-300 pl-11 pr-11 text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
                            />
                            {termo && (
                                <button
                                    type="button"
                                    onClick={limparBusca}
                                    aria-label="Limpar busca"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </form>
                    </div>
                </section>

                <section className="flex flex-1 flex-col justify-center bg-slate-50 py-10">
                    <div className="mx-auto w-full max-w-7xl px-6">
                        {termoAtivo && (
                            <div className="mb-6 flex flex-wrap items-center gap-2">
                                <ChipFiltro
                                    label={`Todos (${contagens.todos})`}
                                    ativo={tipoSelecionado === "todos"}
                                    onClick={() => selecionarTipo("todos")}
                                    corAtivo="badge-neutral text-white"
                                />
                                <ChipFiltro
                                    label={`Notícias (${contagens.noticia})`}
                                    ativo={tipoSelecionado === "noticia"}
                                    onClick={() => selecionarTipo("noticia")}
                                    corAtivo="badge-neutral text-white"
                                />
                                <ChipFiltro
                                    label={`Eventos (${contagens.evento})`}
                                    ativo={tipoSelecionado === "evento"}
                                    onClick={() => selecionarTipo("evento")}
                                    corAtivo="badge-neutral text-white"
                                />
                                <ChipFiltro
                                    label={`Documentos (${contagens.documento})`}
                                    ativo={tipoSelecionado === "documento"}
                                    onClick={() => selecionarTipo("documento")}
                                    corAtivo="badge-neutral text-white"
                                />
                            </div>
                        )}

                        {termoAtivo && (
                            <div className="mb-6">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Categoria
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIAS.map((categoria) => (
                                        <ChipFiltro
                                            key={categoria}
                                            label={categoria}
                                            ativo={categoriaSelecionada === categoria}
                                            onClick={() => selecionarCategoria(categoria)}
                                            corAtivo="border-cyan-300 bg-cyan-600 text-white"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {termoAtivo && tagsDisponiveis.length > 0 && (
                            <div className="mb-8">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tags
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <ChipFiltro
                                        label="Todas"
                                        ativo={tagSelecionada === null}
                                        onClick={() => selecionarTag(null)}
                                        corAtivo="badge-info text-white"
                                    />
                                    {tagsDisponiveis.map((tag) => (
                                        <ChipFiltro
                                            key={tag}
                                            label={tag}
                                            ativo={tagSelecionada === tag}
                                            onClick={() => selecionarTag(tag)}
                                            corAtivo="badge-info text-white"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!termoAtivo ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <SearchIcon className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    Digite algo e aperte Enter para buscar em notícias, eventos e documentos.
                                </p>
                            </div>
                        ) : carregando ? (
                            <div className="flex h-64 items-center justify-center">
                                <span className="loading loading-spinner loading-lg text-slate-500"></span>
                            </div>
                        ) : contagens.todos === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <SearchIcon className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    Nenhum resultado encontrado para "{termoAplicado}".
                                </p>
                                <button
                                    type="button"
                                    onClick={limparBusca}
                                    className="btn btn-outline btn-sm mt-4 gap-2 rounded-full"
                                >
                                    <X size={14} />
                                    Limpar busca
                                </button>
                            </div>
                        ) : tipoSelecionado === "todos" ? (
                            previewTotalmenteVazioPorTag ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                    <SearchIcon className="mx-auto text-slate-400" size={40} />
                                    <p className="mt-4 text-lg text-slate-600">
                                        Nenhum item nesta prévia tem a tag "{tagSelecionada}".
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => selecionarTag(null)}
                                        className="btn btn-outline btn-sm mt-4 gap-2 rounded-full"
                                    >
                                        <X size={14} />
                                        Limpar tag
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-10">
                                    <SecaoPreview
                                        tipo="noticia"
                                        totalBruto={contagens.noticia}
                                        itens={itensNoticiasPreview}
                                        tagAtiva={tagSelecionada !== null}
                                        aoVerTodos={() => selecionarTipo("noticia")}
                                    />
                                    <SecaoPreview
                                        tipo="evento"
                                        totalBruto={contagens.evento}
                                        itens={itensEventosPreview}
                                        tagAtiva={tagSelecionada !== null}
                                        aoVerTodos={() => selecionarTipo("evento")}
                                    />
                                    <SecaoPreview
                                        tipo="documento"
                                        totalBruto={contagens.documento}
                                        itens={itensDocumentosPreview}
                                        tagAtiva={tagSelecionada !== null}
                                        aoVerTodos={() => selecionarTipo("documento")}
                                    />
                                    {previewOrdenado.length > 0 && (
                                        <p className="text-center text-sm text-slate-500">
                                            Mostrando os mais recentes de cada tipo. Selecione um filtro acima para ver a lista completa.
                                        </p>
                                    )}
                                </div>
                            )
                        ) : itensDoTipoSelecionado.length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <SearchIcon className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    Nenhum item nesta página tem a tag "{tagSelecionada}".
                                </p>
                                <button
                                    type="button"
                                    onClick={() => selecionarTag(null)}
                                    className="btn btn-outline btn-sm mt-4 gap-2 rounded-full"
                                >
                                    <X size={14} />
                                    Limpar tag
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="mb-4 text-sm text-slate-500">
                                    {tagSelecionada ? itensDoTipoSelecionado.length : resultadoDoTipoSelecionado?.total}{" "}
                                    {(tagSelecionada ? itensDoTipoSelecionado.length : resultadoDoTipoSelecionado?.total) === 1
                                        ? "resultado encontrado"
                                        : "resultados encontrados"}
                                </p>

                                <div className="flex flex-col gap-4">
                                    {itensDoTipoSelecionado.map((resultado) => (
                                        <CardResultado key={`${resultado.tipo}-${resultado.id}`} resultado={resultado} />
                                    ))}
                                </div>

                                {totalPaginas > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            className="btn btn-circle btn-outline"
                                            disabled={pagina === 0}
                                            onClick={() => irParaPagina(pagina - 1)}
                                        >
                                            ←
                                        </button>

                                        <span className="text-sm font-medium text-slate-600">
                                            Página {pagina + 1} de {totalPaginas}
                                        </span>

                                        <button
                                            type="button"
                                            className="btn btn-circle btn-outline"
                                            disabled={pagina + 1 >= totalPaginas}
                                            onClick={() => irParaPagina(pagina + 1)}
                                        >
                                            →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function ChipFiltro({
    label,
    ativo,
    onClick,
    corAtivo,
}: {
    label: string;
    ativo: boolean;
    onClick: () => void;
    corAtivo: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`badge badge-lg cursor-pointer border-slate-300 ${
                ativo
                    ? corAtivo
                    : "badge-outline bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800"
            }`}
        >
            {label}
        </button>
    );
}

function SecaoPreview({
    tipo,
    totalBruto,
    itens,
    tagAtiva,
    aoVerTodos,
}: {
    tipo: TipoResultadoBusca;
    totalBruto: number;
    itens: ResultadoBusca[];
    tagAtiva: boolean;
    aoVerTodos: () => void;
}) {
    if (itens.length === 0) return null;

    const config = CONFIG_TIPO[tipo];
    const mostrarVerTodos = totalBruto > PREVIEW_TODOS;
    const contagemExibida = tagAtiva ? itens.length : totalBruto;

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                    {config.labelPlural} <span className="font-normal text-slate-500">({contagemExibida})</span>
                </h2>
                {mostrarVerTodos && (
                    <button
                        type="button"
                        onClick={aoVerTodos}
                        className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900"
                    >
                        Ver todos
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {itens.map((resultado) => (
                    <CardResultado key={`${resultado.tipo}-${resultado.id}`} resultado={resultado} />
                ))}
            </div>
        </div>
    );
}

function CardResultado({ resultado }: { resultado: ResultadoBusca }) {
    const config = CONFIG_TIPO[resultado.tipo];
    const Icone = config.icone;

    return (
        <Link
            to={resultado.href}
            className="group flex gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
        >
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                {resultado.imagem ? (
                    <img
                        src={resultado.imagem.caminho}
                        alt={resultado.imagem.nome ?? resultado.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Icone size={28} />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge badge-sm ${config.badge}`}>{config.label}</span>
                    {resultado.dataExibicao && (
                        <span className="text-xs text-slate-500">{resultado.dataExibicao}</span>
                    )}
                </div>

                <h2 className="mt-1 line-clamp-1 text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-sky-700">
                    {resultado.titulo}
                </h2>

                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                    {resultado.resumo}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-1.5">
                        {resultado.categoriaVetor && (
                            <span className="badge badge-xs border-cyan-300 bg-cyan-50 text-cyan-800">
                                {resultado.categoriaVetor}
                            </span>
                        )}
                        {resultado.tags?.slice(0, 3).map((tag) => (
                            <span key={tag.id} className="badge badge-xs badge-outline">
                                {tag.tag}
                            </span>
                        ))}
                    </div>

                    <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-sky-700 transition-colors group-hover:text-sky-900 sm:inline-flex">
                        Ver
                        <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </Link>
    );
}
