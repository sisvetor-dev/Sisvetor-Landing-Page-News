import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Newspaper, X } from 'lucide-react';
import { getNoticiasAtivas } from '../lib/api/noticiaController';
import type { Noticia } from '../lib/api/noticia';
import { CategoriaVetor } from '../lib/api/enum';
import { pertenceCategoria } from '../lib/utils';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function meta() {
  return [
    { title: "Notícias - Sisvetor" },
    { name: "description", content: "Portal de notícias da Sisvetor" },
  ];
}

function formatarData(data?: string): string {
    if (!data) return "";
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const TAMANHO_PAGINA = 12;

const CATEGORIAS: CategoriaVetor[] = [CategoriaVetor.TODOS, CategoriaVetor.DENGUE, CategoriaVetor.CHAGAS];

export default function Noticias() {
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [pagina, setPagina] = useState(0);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaVetor>(CategoriaVetor.TODOS);
    const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);

    useEffect(() => {
        async function carregarNoticias() {
            setCarregando(true);
            try {
                // Não existe endpoint público de filtragem por tag — a filtragem é feita aqui no
                // cliente, então carrega um lote maior de uma vez (mesma limitação de escala do
                // fetch em noticias.$slug.tsx).
                const response = await getNoticiasAtivas(0, 100);
                setNoticias(response.content);
            } catch (error) {
                console.error(error);
            } finally {
                setCarregando(false);
            }
        }

        carregarNoticias();
    }, []);

    // Notícias que passam pelo filtro de categoria — base tanto pras tags disponíveis quanto pra
    // lista final, pra não oferecer uma tag que já não teria nenhum resultado na categoria atual.
    const noticiasPorCategoria = useMemo(() => {
        return noticias.filter((noticia) => pertenceCategoria(noticia.categoriaVetor, categoriaSelecionada));
    }, [noticias, categoriaSelecionada]);

    const tagsDisponiveis = useMemo(() => {
        const tags = new Set<string>();
        noticiasPorCategoria.forEach((noticia) => {
            noticia.tags?.forEach((tag) => tags.add(tag.tag));
        });
        return Array.from(tags).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [noticiasPorCategoria]);

    const noticiasFiltradas = useMemo(() => {
        if (!tagSelecionada) return noticiasPorCategoria;
        return noticiasPorCategoria.filter((noticia) => noticia.tags?.some((tag) => tag.tag === tagSelecionada));
    }, [noticiasPorCategoria, tagSelecionada]);

    const totalPaginas = Math.ceil(noticiasFiltradas.length / TAMANHO_PAGINA);
    const noticiasDaPagina = noticiasFiltradas.slice(
        pagina * TAMANHO_PAGINA,
        pagina * TAMANHO_PAGINA + TAMANHO_PAGINA
    );

    function selecionarCategoria(categoria: CategoriaVetor) {
        setCategoriaSelecionada(categoria);
        setTagSelecionada(null);
        setPagina(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function selecionarTag(tag: string | null) {
        setTagSelecionada(tag);
        setPagina(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function limparFiltros() {
        setCategoriaSelecionada(CategoriaVetor.TODOS);
        setTagSelecionada(null);
        setPagina(0);
    }

    function irParaPagina(novaPagina: number) {
        setPagina(novaPagina);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex flex-1 flex-col">
                <section className="bg-gradient-to-b from-white to-sky-50 py-10">
                    <div className="mx-auto max-w-7xl px-6">
                        {/* <span className="badge badge-info badge-outline w-fit">
                            Portal de Notícias
                        </span> */}
                        <h1 className="mt-5 text-4xl font-bold text-slate-900">
                            Notícias do SisVetor
                        </h1>
                        <p className="mt-3 max-w-2xl text-lg text-slate-600">
                            Acompanhe as publicações mais recentes sobre as ações de vigilância
                            epidemiológica realizadas em todo o território nacional.
                        </p>
                    </div>
                </section>

                <section className="flex flex-1 flex-col justify-center bg-slate-50 py-10">
                    <div className="mx-auto w-full max-w-7xl px-6">
                        <div className="mb-6">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Categoria
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIAS.map((categoria) => (
                                    <button
                                        key={categoria}
                                        type="button"
                                        onClick={() => selecionarCategoria(categoria)}
                                        className={`badge badge-lg cursor-pointer border-slate-300 ${
                                            categoriaSelecionada === categoria
                                                ? "border-cyan-300 bg-cyan-600 text-white"
                                                : "badge-outline bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-700"
                                        }`}
                                    >
                                        {categoria}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {tagsDisponiveis.length > 0 && (
                            <div className="mb-8">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tags
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selecionarTag(null)}
                                        className={`badge badge-lg cursor-pointer border-slate-300 ${
                                            tagSelecionada === null
                                                ? "badge-info text-white"
                                                : "badge-outline bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
                                        }`}
                                    >
                                        Todas
                                    </button>
                                    {tagsDisponiveis.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => selecionarTag(tag)}
                                            className={`badge badge-lg cursor-pointer border-slate-300 ${
                                                tagSelecionada === tag
                                                    ? "badge-info text-white"
                                                    : "badge-outline bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {carregando ? (
                            <div className="flex h-64 items-center justify-center">
                                <span className="loading loading-spinner loading-lg text-sky-700"></span>
                            </div>
                        ) : noticiasFiltradas.length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <Newspaper className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    {tagSelecionada
                                        ? `Nenhuma notícia encontrada para a tag "${tagSelecionada}"${
                                              categoriaSelecionada !== CategoriaVetor.TODOS ? ` em ${categoriaSelecionada}` : ""
                                          }.`
                                        : categoriaSelecionada !== CategoriaVetor.TODOS
                                        ? `Nenhuma notícia encontrada em ${categoriaSelecionada}.`
                                        : "Nenhuma notícia encontrada."}
                                </p>
                                {(tagSelecionada || categoriaSelecionada !== CategoriaVetor.TODOS) && (
                                    <button
                                        type="button"
                                        onClick={limparFiltros}
                                        className="btn btn-outline btn-sm mt-4 gap-2 rounded-full"
                                    >
                                        <X size={14} />
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                    {noticiasDaPagina.map((noticia) => (
                                        <Link
                                            key={noticia.id}
                                            to={`/noticias/${noticia.caminhoURL}`}
                                            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <div className="h-48 overflow-hidden bg-slate-100">
                                                {noticia.imagemDestaque ? (
                                                    <img
                                                        src={noticia.imagemDestaque.caminho}
                                                        alt={noticia.imagemDestaque.nome}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                        <Newspaper size={40} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col p-6">
                                                <span className="text-xs text-slate-500">
                                                    {formatarData(noticia.createdAt)}
                                                </span>

                                                <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-sky-700">
                                                    {noticia.titulo}
                                                </h2>

                                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                                                    {noticia.resumo}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {noticia.categoriaVetor && (
                                                        <span className="badge badge-sm border-cyan-300 bg-cyan-50 text-cyan-800">
                                                            {noticia.categoriaVetor}
                                                        </span>
                                                    )}
                                                    {noticia.tags?.map((tag) => (
                                                        <span key={tag.id} className="badge badge-sm badge-outline">
                                                            {tag.tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition-colors group-hover:text-sky-900">
                                                    Ver detalhes
                                                    <ArrowRight size={16} />
                                                </span>
                                            </div>
                                        </Link>
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
                                            <ArrowLeft size={18} />
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
                                            <ArrowRight size={18} />
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
