import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, X } from 'lucide-react';
import type { Evento } from '../lib/api/evento';
import { CategoriaVetor } from '../lib/api/enum';
import { pertenceCategoria } from '../lib/utils';
import { useEventosAtivos } from '../lib/hooks/useEventosAtivos';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function meta() {
  return [
    { title: "Eventos - Sisvetor" },
    { name: "description", content: "Eventos e capacitações do Portal SisVetor" },
  ];
}

const TAMANHO_PAGINA = 12;

const CATEGORIAS: CategoriaVetor[] = [CategoriaVetor.TODOS, CategoriaVetor.DENGUE, CategoriaVetor.CHAGAS];

export function formatarData(data?: string): string {
    if (!data) return "";
    // Datas vêm como "2026-08-20" (LocalDate). Construir com Date(string) interpretaria como UTC e
    // poderia recuar um dia dependendo do fuso, então monta a data manualmente.
    const [ano, mes, dia] = data.split("-").map(Number);
    if (!ano || !mes || !dia) return "";
    return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatarHora(hora?: string): string {
    if (!hora) return "";
    return hora.slice(0, 5);
}

export default function Eventos() {
    const { eventos, carregando } = useEventosAtivos();
    const [pagina, setPagina] = useState(0);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaVetor>(CategoriaVetor.TODOS);
    const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);

    const eventosPorCategoria = useMemo(() => {
        return eventos.filter((evento) => pertenceCategoria(evento.categoriaVetor, categoriaSelecionada));
    }, [eventos, categoriaSelecionada]);

    const tagsDisponiveis = useMemo(() => {
        const tags = new Set<string>();
        eventosPorCategoria.forEach((evento) => evento.tags?.forEach((tag) => tags.add(tag.tag)));
        return Array.from(tags).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [eventosPorCategoria]);

    const eventosFiltrados = useMemo(() => {
        if (!tagSelecionada) return eventosPorCategoria;
        return eventosPorCategoria.filter((evento) => evento.tags?.some((tag) => tag.tag === tagSelecionada));
    }, [eventosPorCategoria, tagSelecionada]);

    const totalPaginas = Math.ceil(eventosFiltrados.length / TAMANHO_PAGINA);
    const eventosDaPagina = eventosFiltrados.slice(
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
                <section className="bg-gradient-to-b from-white to-emerald-50 py-10">
                    <div className="mx-auto max-w-7xl px-6">
                        {/* <span className="badge badge-success badge-outline w-fit">
                            Agenda
                        </span> */}
                        <h1 className="mt-5 text-4xl font-bold text-slate-900">
                            Eventos do SisVetor
                        </h1>
                        <p className="mt-3 max-w-2xl text-lg text-slate-600">
                            Workshops, webinários, oficinas e capacitações voltados às equipes de
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
                                                ? "badge-success text-white"
                                                : "badge-outline bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
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
                                                    ? "badge-success text-white"
                                                    : "badge-outline bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
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
                                <span className="loading loading-spinner loading-lg text-emerald-700"></span>
                            </div>
                        ) : eventosFiltrados.length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <CalendarDays className="mx-auto text-slate-400" size={40} />
                                <p className="mt-4 text-lg text-slate-600">
                                    {tagSelecionada
                                        ? `Nenhum evento encontrado para a tag "${tagSelecionada}"${
                                              categoriaSelecionada !== CategoriaVetor.TODOS ? ` em ${categoriaSelecionada}` : ""
                                          }.`
                                        : categoriaSelecionada !== CategoriaVetor.TODOS
                                        ? `Nenhum evento encontrado em ${categoriaSelecionada}.`
                                        : "Nenhum evento programado no momento."}
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
                                    {eventosDaPagina.map((evento) => (
                                        <CardEvento key={evento.id} evento={evento} />
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

function CardEvento({ evento }: { evento: Evento }) {
    return (
        <Link
            to={`/eventos/${evento.caminhoURL}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="h-48 overflow-hidden bg-slate-100">
                {evento.imagemDestaque ? (
                    <img
                        src={evento.imagemDestaque.caminho}
                        alt={evento.imagemDestaque.nome ?? evento.nome}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <CalendarDays size={40} />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-6">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <CalendarDays size={14} />
                    {formatarData(evento.dataInicio)}
                    {evento.horaInicio && ` · ${formatarHora(evento.horaInicio)}`}
                </span>

                <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-emerald-700">
                    {evento.nome}
                </h2>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {evento.descricao}
                </p>

                <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} />
                    {evento.modalidade}
                    {evento.local && ` · ${evento.local}`}
                </span>

                <div className="mt-4 flex flex-wrap gap-2">
                    {evento.categoriaVetor && (
                        <span className="badge badge-sm border-cyan-300 bg-cyan-50 text-cyan-800">
                            {evento.categoriaVetor}
                        </span>
                    )}
                    {evento.tags?.map((tag) => (
                        <span key={tag.id} className="badge badge-sm badge-outline">
                            {tag.tag}
                        </span>
                    ))}
                </div>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition-colors group-hover:text-emerald-900">
                    Ver detalhes
                    <ArrowRight size={16} />
                </span>
            </div>
        </Link>
    );
}
