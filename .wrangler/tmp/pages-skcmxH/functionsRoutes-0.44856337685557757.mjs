import { onRequestGet as __api_sync_js_onRequestGet } from "/Users/kh/.gemini/antigravity/scratch/kuwagata-card-studio/functions/api/sync.js"
import { onRequestPost as __api_sync_js_onRequestPost } from "/Users/kh/.gemini/antigravity/scratch/kuwagata-card-studio/functions/api/sync.js"
import { onRequestPut as __api_sync_js_onRequestPut } from "/Users/kh/.gemini/antigravity/scratch/kuwagata-card-studio/functions/api/sync.js"

export const routes = [
    {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_sync_js_onRequestGet],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_js_onRequestPost],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_sync_js_onRequestPut],
    },
  ]