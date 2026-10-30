import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

// Workers Cache est inclus avec Workers : contrairement au Response Store,
// il ne requiert ni bucket R2 ni souscription de stockage.
const workersCache = await createWorkersCacheConfig();

export default defineConfig({
  worker: defineWorker({
    ...workersCache,
    name: "frontend",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-30",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...workersCache.env,
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
