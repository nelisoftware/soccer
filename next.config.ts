import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // Só a versão vai para o bundle (importar o package.json no cliente levaria o arquivo inteiro).
  env: {
    APP_VERSION: version,
  },
  // Esconde o botão "N" do Next no `next dev` (erros de compilação/execução continuam aparecendo).
  devIndicators: false,
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        // O navegador sempre busca a versão nova do service worker.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
