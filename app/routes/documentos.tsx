import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Download, FileText, X } from 'lucide-react';
import type { Documento } from '../lib/api/documento';
import { CategoriaVetor } from '../lib/api/enum';
import { pertenceCategoria } from '../lib/utils';
import { useDocumentosAtivos } from '../lib/hooks/useDocumentosAtivos';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function meta() {
  return [
    { title: "Documentos - Sisvetor" },
    { name: "description", content: "Documentos técnicos do Portal SisVetor" },
  ];
}

const TAMANHO_PAGINA = 12;

const CATEGORIAS: CategoriaVetor[] = [CategoriaVetor.TODOS, CategoriaVetor.DENGUE, CategoriaVetor.CHAGAS];

export function formatarData(data?: string): string {
    if (!data) return "";
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatarTamanho(bytes?: number): string {
    if (!bytes) return "";
    const unidades = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${unidades[i]}`;
}

export default function Documentos() {
    const { documentos, carregando } = useDocumentosAtivos();
    const [pagina, setPagina] = useState(0);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaVetor>(CategoriaVetor.TODOS);
    const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);

    const documentosPorCategoria = useMemo(() => {
        return documentos.filter((doc) => pertenceCategoria(doc.categoriaVetor, categoriaSelecionada));
    }, [documentos, categoriaSelecionada]);

    const tagsDisponiveis = useMemo(() => {
        const tags = new Set<string>();
        documentosPorCategoria.forEach((doc) => doc.tags?.forEach((tag) => tags.add(tag.tag)));
        return Array.from(tags).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [documentosPorCategoria]);

    const documentosFiltrados = useMemo(() => {
        if (!tagSelecionada) return documentosPorCategoria;
        return documentosPorCategoria.filter((doc) => doc.tags?.some((tag) => tag.tag === tagSelecionada));
    }, [documentosPorCategoria, tagSelecionada]);

    const totalPaginas = Math.ceil(documentosFiltrados.length / TAMANHO_PAGINA);
    const documentosDaPagina = documentosFiltrados.slice(
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
                <section className="bg-gradient-to-b from-white to-indigo-50 py-10">
                    <div className="mx-auto max-w-7xl px-6">
                        {/* <span className="badge badge-primary badge-outline w-fit">
                            Biblioteca
                        </span> */}
                        <h1 className="mt-5 text-4xl font-bold text-slate-900">
                            Documentos Técnicos
                        </h1>
                        <p className="mt-3 max-w-2xl text-lg text-slate-600">
                            Manuais, notas técnicas, protocolos e materiais de apoio às ações de
                            vigilância epidemiológica.
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
                                                ? "badge-primary text-white"
                                                : "badge-outline bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    {tagsDisponiveis.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => selecionarTag(tag)}
                                            className={`badge badge-lg cursor-pointer border-slate-300 ${
                                                tagSelecionada === tag
                                                    ? "badge-primary text-white"
                                                    : "badge-outline bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
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
                                <span className="loading loading-spinner loading-lg text-indigo-700"></span>
                            </div>
                        ) : documentosFiltrados.length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <FileText className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    {tagSelecionada
                                        ? `Nenhum documento encontrado para a tag "${tagSelecionada}"${
                                              categoriaSelecionada !== CategoriaVetor.TODOS ? ` em ${categoriaSelecionada}` : ""
                                          }.`
                                        : categoriaSelecionada !== CategoriaVetor.TODOS
                                        ? `Nenhum documento encontrado em ${categoriaSelecionada}.`
                                        : "Nenhum documento publicado até o momento."}
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
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {documentosDaPagina.map((documento) => (
                                        <CardDocumento key={documento.id} documento={documento} />
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

function CardDocumento({ documento }: { documento: Documento }) {
    return (
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
                    <FileText size={22} />
                </div>
                <Link
                    to={`/documentos/${documento.caminhoURL}`}
                    className="flex-1 text-lg font-bold leading-tight text-slate-900 transition-colors hover:text-indigo-700"
                >
                    {documento.titulo}
                </Link>
            </div>

            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                {documento.resumo}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                {documento.categoriaVetor && (
                    <span className="badge badge-sm border-cyan-300 bg-cyan-50 text-cyan-800">
                        {documento.categoriaVetor}
                    </span>
                )}
                {documento.tags?.map((tag) => (
                    <span key={tag.id} className="badge badge-sm badge-outline">
                        {tag.tag}
                    </span>
                ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
                {documento.arquivo?.caminho && (
                    <a
                        href={documento.arquivo.caminho}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm gap-2 rounded-full bg-indigo-700 text-white hover:bg-indigo-800"
                    >
                        <Download size={14} />
                        Baixar
                    </a>
                )}
                <Link
                    to={`/documentos/${documento.caminhoURL}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                >
                    Detalhes
                    <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
