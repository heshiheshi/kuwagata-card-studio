// Cloudflare Pages Serverless Sync Function
export async function onRequestGet(context) {
  try {
    const cloudResp = await fetch("https://api.restful-api.dev/objects/ff808181a04ccf2d01a04ceb91a200e7");
    const json = await cloudResp.json();
    return new Response(JSON.stringify(json.data || json), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  try {
    const body = await context.request.json();
    // 🛡️ APIキーの完全抹消 (サーバー側二重防御)
    delete body.freeApiKey;
    delete body.paidApiKey;
    delete body.activeKeyMode;

    const cloudResp = await fetch("https://api.restful-api.dev/objects/ff808181a04ccf2d01a04ceb91a200e7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "KUWAGATA_SHARED_STUDIO",
        data: body
      })
    });
    const json = await cloudResp.json();
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
