import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/noticias", "routes/noticias.tsx"),
  route("/noticias/:slug", "routes/noticias.$slug.tsx"),
  route("/eventos", "routes/eventos.tsx"),
  route("/eventos/:slug", "routes/eventos.$slug.tsx"),
  route("/documentos", "routes/documentos.tsx"),
  route("/documentos/:slug", "routes/documentos.$slug.tsx"),
  route("/contato", "routes/contato.tsx"),
  route("/search", "routes/search.tsx"),
] satisfies RouteConfig;
