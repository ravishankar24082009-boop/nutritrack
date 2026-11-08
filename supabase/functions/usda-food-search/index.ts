const allowedOrigins = new Set([
  "https://nutritrack-rho-flame.vercel.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

function corsHeaders(origin: string | null) {
  const vercelPreview = origin && /^https:\/\/nutritrack-[a-z0-9-]+-bots-5d0c\.vercel\.app$/.test(origin);
  const allowedOrigin = origin && (allowedOrigins.has(origin) || vercelPreview) ? origin : "https://nutritrack-rho-flame.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}

function nutrient(food: any, ids: number[]) {
  const match = (food.foodNutrients || []).find((item: any) => ids.includes(item.nutrientId) && Number.isFinite(Number(item.value)));
  return match ? Number(match.value) : null;
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request.headers.get("origin"));
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Use POST to search foods." }, 405, headers);

  const apiKey = Deno.env.get("USDA_API_KEY");
  if (!apiKey) return json({ error: "The USDA_API_KEY secret is not configured for this function." }, 503, headers);

  let query: string;
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.trim().slice(0, 100) : "";
  } catch {
    return json({ error: "Send a JSON body with a query field." }, 400, headers);
  }
  if (query.length < 2) return json({ error: "Enter at least two characters to search." }, 400, headers);

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: 12,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
      }),
    });
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return json({ error: response.status === 429 ? "USDA search is temporarily rate limited." : "USDA FoodData Central could not complete the search." }, status, headers);
    }

    const result = await response.json();
    const foods = (Array.isArray(result.foods) ? result.foods : []).map((food: any) => ({
      fdcId: food.fdcId,
      name: food.description,
      kcal: nutrient(food, [1008, 2048, 2047]),
      prot: nutrient(food, [1003]),
      carb: nutrient(food, [1005]),
      fat: nutrient(food, [1004]),
      foodCategory: food.foodCategory || "",
      dataType: food.dataType || "",
      source: "USDA",
    })).filter((food: any) => Number.isFinite(food.kcal) && Number.isFinite(food.prot));

    return json({ foods }, 200, headers);
  } catch {
    return json({ error: "Could not reach USDA FoodData Central." }, 502, headers);
  }
});
