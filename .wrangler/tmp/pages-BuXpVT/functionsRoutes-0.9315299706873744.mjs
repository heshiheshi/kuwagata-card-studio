import { onRequestGet as __api_sync_js_onRequestGet } from "/Users/kh/.gemini/antigravity/scratch/kuwagata/kuwagata-card-studio/functions/api/sync.js"
import { onRequestOptions as __api_sync_js_onRequestOptions } from "/Users/kh/.gemini/antigravity/scratch/kuwagata/kuwagata-card-studio/functions/api/sync.js"
import { onRequestPost as __api_sync_js_onRequestPost } from "/Users/kh/.gemini/antigravity/scratch/kuwagata/kuwagata-card-studio/functions/api/sync.js"
import { onRequestPut as __api_sync_js_onRequestPut } from "/Users/kh/.gemini/antigravity/scratch/kuwagata/kuwagata-card-studio/functions/api/sync.js"

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
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_sync_js_onRequestOptions],
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