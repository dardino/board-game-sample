import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 8080,
    proxy: { // abilitiamo il proxy
      "/api": { // path da intercettare, siginfica "tutti quelli che cominciano per `/api`
        target: "http://localhost:3000", // server a cui girare la richiesta
        changeOrigin: true, // modifica l'origin per "simulare" come se la chiamata arrivasse dall'host 3000
        rewrite: (path) => path.replace(
          /^\/api/,
          ""
        ) // toglie la parte `api` dall'url: il server non ne ha bisogno
      }
    }
  }
});
