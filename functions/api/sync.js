/**
 * Cloudflare Pages Functions - KUWAGATA STUDIO OFFICIAL KV SYNC API
 */

let memoryStore = null;

export async function onRequestGet(context) {
  try {
    let rawData = null;

    // 1. Cloudflare KV から取得
    if (context.env && context.env.STUDIO_KV) {
      rawData = await context.env.STUDIO_KV.get("kuwagata_shared_studio_data");
    }

    // 2. フォールバック
    if (!rawData && memoryStore) {
      rawData = JSON.stringify(memoryStore);
    }

    if (rawData) {
      return new Response(rawData, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({ status: "empty", chips: [], cardArchive: [] }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
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

    // 🛡️ APIキーのサーバー側完全抹消 (セキュリティ二重防衛)
    delete body.freeApiKey;
    delete body.paidApiKey;
    delete body.activeKeyMode;

    body.serverTimestamp = Date.now();
    memoryStore = body;

    const jsonStr = JSON.stringify(body);

    // Cloudflare KV へ保存
    if (context.env && context.env.STUDIO_KV) {
      await context.env.STUDIO_KV.put("kuwagata_shared_studio_data", jsonStr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Cloudflare KV 保存成功",
      chipsCount: body.chips ? body.chips.length : 0,
      archiveCount: body.cardArchive ? body.cardArchive.length : 0,
      updatedAt: body.serverTimestamp
    }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
