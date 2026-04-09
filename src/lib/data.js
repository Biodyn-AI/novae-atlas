// Centralized data fetching with caching.
// All data files are baked under /data/ by scripts/05_build_atlas_data.py
// and served as static JSON from public/data/.

const BASE = `${import.meta.env.BASE_URL}data`

const cache = new Map()

async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path)
  const url = `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`)
  const data = await res.json()
  cache.set(path, data)
  return data
}

export async function getManifest() {
  return fetchJson('/manifest.json')
}

export async function getGlobalSummary() {
  return fetchJson('/global_summary.json')
}

export async function getSpotlight() {
  return fetchJson('/spotlight_features.json')
}

export async function getGeneIndex() {
  return fetchJson('/gene_index.json')
}

export async function getNicheIndex() {
  return fetchJson('/niche_index.json')
}

export async function getCellTypeIndex() {
  return fetchJson('/celltype_index.json')
}

export async function getNicheCommunication() {
  try {
    return await fetchJson('/niche_communication.json')
  } catch (e) {
    return null
  }
}

export async function getSurfaces() {
  return fetchJson('/surfaces.json')
}

export async function getSlides() {
  return fetchJson('/slides.json')
}

export async function getFeatureTable(surface) {
  return fetchJson(`/features/${surface}.json`)
}

export async function getFeatureDetail(surface, idx) {
  // Try the per-feature detail file first (aggregator + cell_embedder).
  // If absent (conv layers), fall back to the slim table row.
  try {
    return await fetchJson(`/feature_detail/${surface}/${idx}.json`)
  } catch (e) {
    const features = await getFeatureTable(surface)
    const row = features.find((f) => Number(f.feature_idx) === Number(idx))
    if (!row) throw new Error(`feature ${idx} not found in surface ${surface}`)
    return {
      surface,
      feature_idx: Number(idx),
      alive: row.alive,
      n_active_cells: row.n_active_cells,
      mean_abs: row.mean_abs,
      max_abs: row.max_abs,
      top_tissue: row.top_tissue,
      top_tissue_frac: row.top_tissue_frac,
      top_tech: row.top_tech,
      top_tech_frac: row.top_tech_frac,
      tech_confound: row.tech_confound,
      top_genes: [],
      enrichments: {},
      domains: {},
      causal: null,
      morans: null,
      module: row.module_id != null ? { module_id: row.module_id, P_i: row.module_p } : null,
      _slim_only: true,
    }
  }
}

export async function getModules(surface) {
  return fetchJson(`/modules/${surface}.json`)
}

export async function getSlideBackground(slideIdx) {
  return fetchJson(`/spatial/slide_${slideIdx}.json`)
}

export async function getFeatureSpatial(surface, idx) {
  return fetchJson(`/spatial/feature/${surface}/${idx}.json`)
}
