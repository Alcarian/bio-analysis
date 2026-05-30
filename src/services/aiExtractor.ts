import { getAISettings, saveAISettings } from "./aiSettings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIResult {
  testName: string;
  value: number;
  unit: string;
  normalRange?: string;
}

export type AIModelState = "idle" | "loading" | "ready" | "error";

// ─── Configuration ────────────────────────────────────────────────────────────

/** Nombre max de caractères par chunk envoyé au modèle */
const MAX_CHUNK_CHARS = 8000;

/** Nombre max de tokens à générer (inclut les tokens de raisonnement si thinking activé) */
const MAX_NEW_TOKENS = 8192;

/** Timeout de la requête d'inférence (ms) */
const INFERENCE_TIMEOUT_MS = 180_000; // 3 min

// ─── Prompt ───────────────────────────────────────────────────────────────────

const buildMessages = (text: string) => [
  {
    role: "system",
    content: [
      "Tu es un extracteur expert de résultats d'analyses biologiques médicales françaises.",
      "Extrais TOUS les tests biologiques du document suivant.",
      "",
      "Règles STRICTES :",
      "- Extraire TOUS les tests sans en omettre aucun.",
      "- Si le même test existe en version SANGUINE et URINAIRE, les extraire TOUS LES DEUX.",
      "  Exemple de noms : 'Créatinine' (sang) et 'Créatinine urinaire' sont deux entrées distinctes.",
      "- La VALEUR (value) est le nombre mesuré pour CE patient. Ne jamais mettre une valeur de référence.",
      "- La plage de référence (normalRange) est la norme du laboratoire : format '3.90-6.10' ou '< 5.0'.",
      "- Convertir les virgules décimales en point : 5,20 → 5.20",
      "- Ne jamais inventer de données absentes du texte.",
      "- Répondre UNIQUEMENT avec un tableau JSON valide, rien d'autre.",
      'Format : [{"testName":"string","value":number,"unit":"string","normalRange":"string (optionnel)"}]',
      "Si aucun résultat : []",
    ].join("\n"),
  },
  {
    role: "user",
    // /no_think : soft switch officiel Qwen3 pour désactiver le raisonnement interne
    content: text + "\n/no_think",
  },
];

// ─── Parsing de la sortie ─────────────────────────────────────────────────────

const parseAIOutput = (raw: string): AIResult[] => {
  // Supprimer les blocs <think>...</think> si le thinking s'est quand même déclenché
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const jsonMatches = [...cleaned.matchAll(/\[[\s\S]*?\]/g)];

  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) continue;

      const valid: AIResult[] = parsed.filter(
        (item: unknown) =>
          item !== null &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).testName === "string" &&
          (item as Record<string, unknown>).testName !== "" &&
          typeof (item as Record<string, unknown>).value === "number" &&
          !isNaN((item as Record<string, unknown>).value as number) &&
          typeof (item as Record<string, unknown>).unit === "string" &&
          (item as Record<string, unknown>).unit !== "",
      ) as AIResult[];

      if (valid.length > 0) return valid;
    } catch {
      // essayer le match suivant
    }
  }

  if (cleaned !== "[]" && cleaned !== "") {
    console.warn(
      "[aiExtractor] JSON invalide ou vide :",
      cleaned.slice(0, 300),
    );
  }
  return [];
};

// ─── Chunking ─────────────────────────────────────────────────────────────────

/**
 * Découpe le texte en chunks en coupant aux fins de lignes
 * pour ne pas couper au milieu d'un test.
 */
const chunkText = (text: string): string[] => {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_CHARS, text.length);
    const slice = text.slice(start, end);

    // Couper à la dernière fin de ligne si possible (≥ 70% du chunk)
    const lastNewline =
      end < text.length ? slice.lastIndexOf("\n") : slice.length;
    const breakPoint =
      lastNewline > MAX_CHUNK_CHARS * 0.7 ? lastNewline : slice.length;

    chunks.push(text.slice(start, start + breakPoint).trim());
    start += breakPoint + 1;
  }

  return chunks.filter((c) => c.length > 0);
};

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * En développement, on passe par le proxy CRA (URL relative → pas de CORS).
 * En production, on utilise l'URL complète configurée par l'utilisateur.
 */
const getApiBase = (): string => {
  if (process.env.NODE_ENV === "development") return "";
  return getAISettings().serverUrl;
};

/**
 * Retourne true si une URL de serveur LM Studio est configurée
 * (ou si on est en mode développement avec le proxy).
 */
export const isAIReady = (): boolean => {
  if (process.env.NODE_ENV === "development") return true;
  const { serverUrl } = getAISettings();
  return !!serverUrl && serverUrl.trim() !== "";
};

export const getAIModelState = (): AIModelState => {
  return isAIReady() ? "ready" : "idle";
};

/**
 * Vérifie la connexion au serveur LM Studio et retourne la liste des modèles.
 */
export const checkLMStudioConnection = async (): Promise<{
  ok: boolean;
  models: string[];
  error?: string;
}> => {
  const apiBase = getApiBase();
  // En production, vérifier qu'une URL est configurée
  if (process.env.NODE_ENV !== "development" && !apiBase) {
    return { ok: false, models: [], error: "URL non configurée" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${apiBase}/v1/models`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      return { ok: false, models: [], error: `Erreur HTTP ${res.status}` };
    }

    const data = await res.json();
    const models: string[] = (data.data ?? [])
      .map((m: Record<string, unknown>) => m.id as string)
      .filter(Boolean);

    return { ok: true, models };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message.toLowerCase()
        : String(err).toLowerCase();

    if (msg.includes("abort") || msg.includes("timeout")) {
      return {
        ok: false,
        models: [],
        error:
          "Timeout — LM Studio ne répond pas. Vérifiez que le serveur est bien démarré.",
      };
    }

    // "Failed to fetch" / TypeError = CORS bloqué ou serveur inaccessible
    return {
      ok: false,
      models: [],
      error: "CORS_OR_NETWORK" as const,
    };
  }
};

/**
 * Extrait les résultats biologiques depuis un texte brut via LM Studio.
 * Découpe automatiquement en chunks si le texte est trop long.
 */
export const extractWithAI = async (text: string): Promise<AIResult[]> => {
  const apiBase = getApiBase();
  const settings = getAISettings();

  if (process.env.NODE_ENV !== "development" && !apiBase) {
    console.warn("[aiExtractor] Serveur LM Studio non configuré");
    return [];
  }

  const chunks = chunkText(text.trim());
  const allResults: AIResult[] = [];
  const seenTests = new Set<string>();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.trim()) continue;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = {
        messages: buildMessages(chunk),
        max_tokens: MAX_NEW_TOKENS,
        temperature: 0.05,
        stream: false,
        // Désactive le mode "thinking" de Qwen3 via les deux mécanismes :
        // - chat_template_kwargs : paramètre LM Studio (transmis au template Jinja)
        // - enable_thinking : fallback pour certaines versions de LM Studio
        // Sans cela, Qwen3-32B consomme tous les tokens en raisonnement interne
        chat_template_kwargs: { enable_thinking: false },
        enable_thinking: false,
      };

      if (settings.modelId) {
        body.model = settings.modelId;
      }

      const res = await fetch(`${apiBase}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(INFERENCE_TIMEOUT_MS),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`[aiExtractor] Erreur API (${res.status}):`, errorText);
        continue;
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const content: string = choice?.message?.content ?? "";
      const finishReason: string = choice?.finish_reason ?? "";

      if (finishReason === "length") {
        console.warn(
          `[aiExtractor] Chunk ${i + 1}: réponse tronquée (max_tokens atteint) — ` +
            `augmenter MAX_NEW_TOKENS ou réduire MAX_CHUNK_CHARS`,
        );
      }

      if (!content.trim()) {
        console.warn(
          `[aiExtractor] Chunk ${i + 1}: contenu vide (finish_reason: "${finishReason}"). ` +
            `Vérifier que enable_thinking est supporté par cette version de LM Studio.`,
        );
        continue;
      }

      const results = parseAIOutput(content);

      // Dédupliquer par nom de test + unité
      // (même nom mais unité différente = sang vs urine = tests distincts)
      for (const r of results) {
        const key = `${r.testName.toLowerCase().trim()}||${r.unit.toLowerCase().trim()}`;
        if (!seenTests.has(key)) {
          seenTests.add(key);
          allResults.push(r);
        }
      }

      console.info(
        `[aiExtractor] Chunk ${i + 1}/${chunks.length} → ${results.length} résultat(s)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("timeout") || msg.includes("abort")) {
        console.error(
          `[aiExtractor] Timeout chunk ${i + 1} — le modèle met trop de temps à répondre`,
        );
      } else {
        console.error(`[aiExtractor] Erreur chunk ${i + 1}:`, err);
      }
    }
  }

  console.info(
    `[aiExtractor] Total: ${allResults.length} résultat(s) extraits`,
  );
  return allResults;
};

/**
 * Compatibilité : teste la connexion (remplace l'ancien "download du modèle").
 */
export const initAIExtractor = async (): Promise<void> => {
  const { ok, error } = await checkLMStudioConnection();
  if (!ok) throw new Error(error ?? "Impossible de se connecter à LM Studio");
};

/** Ré-exporter pour les modules qui importent depuis aiExtractor */
export { getAISettings, saveAISettings } from "./aiSettings";
