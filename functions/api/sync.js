/**
 * Cloudflare Pages Functions - KUWAGATA STUDIO OFFICIAL KV SYNC API
 * Multi-Origin CORS & Preflight Support for localhost development and production
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function onRequestGet(context) {
  try {
    let rawData = null;

    if (context.env && context.env.STUDIO_KV) {
      rawData = await context.env.STUDIO_KV.get("kuwagata_shared_studio_data");
    }

    if (rawData) {
      return new Response(rawData, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...CORS_HEADERS
        }
      });
    }

    return new Response(JSON.stringify({ status: "empty", chips: [], cardArchive: [] }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...CORS_HEADERS
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...CORS_HEADERS
      }
    });
  }
}

export async function onRequestPut(context) {
  return handleSave(context);
}

export async function onRequestPost(context) {
  return handleSave(context);
}

async function handleSave(context) {
  try {
    const body = await context.request.json();

    // 🛡️ APIキーの完全抹消 (セキュリティ二重防衛)
    delete body.freeApiKey;
    delete body.paidApiKey;
    delete body.activeKeyMode;

    body.serverTimestamp = Date.now();
    const jsonStr = JSON.stringify(body);

    if (context.env && context.env.STUDIO_KV) {
      await context.env.STUDIO_KV.put("kuwagata_shared_studio_data", jsonStr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Cloudflare KV 保存完全成功",
      chipsCount: body.chips ? body.chips.length : 0,
      archiveCount: body.cardArchive ? body.cardArchive.length : 0,
      updatedAt: body.serverTimestamp
    }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...CORS_HEADERS
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...CORS_HEADERS
      }
    });
  }
}
