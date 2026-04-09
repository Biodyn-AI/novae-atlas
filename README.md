# Novae SAE Atlas

**Live site**: https://biodyn-ai.github.io/novae-atlas/

A sparse-autoencoder atlas of [Novae](https://www.nature.com/articles/s41592-025-02899-6),
the spatial-omics foundation model from MICS-Lab. We trained TopK SAEs on every internal
layer of `novae-human-0` and characterized every learned feature with gene markers,
cell-type databases, Novae's own hierarchical niches, causal ablation, and spatial
coherence — to find out what the model has actually learned about biology.

The atlas surfaces ~50,000 features across 12 hooked surfaces of the model, indexed by
30,206 genes, 178 PanglaoDB cell types, and 92 hierarchical Novae niches. Each feature
has a per-cell spatial projection on a real tissue slide.

**Quick links**:
- [Tour — 2-minute guided walkthrough](https://biodyn-ai.github.io/novae-atlas/#/tour)
- [Stories — 4 curated narratives](https://biodyn-ai.github.io/novae-atlas/#/stories)
- [Cell types](https://biodyn-ai.github.io/novae-atlas/#/celltypes) ·
  [Niches](https://biodyn-ai.github.io/novae-atlas/#/niches) ·
  [Genes](https://biodyn-ai.github.io/novae-atlas/#/genes) ·
  [Surfaces](https://biodyn-ai.github.io/novae-atlas/#/surfaces) ·
  [About / glossary](https://biodyn-ai.github.io/novae-atlas/#/about)

---

## This repo

This is the static React + Vite frontend that serves the atlas. All data is baked as
JSON under `public/data/` at build time, so the deployed site is fully static (no API
server).

Interactive sparse-autoencoder atlas of the **novae-human-0** spatial-omics
foundation model. React + Vite + Tailwind + Plotly. All data is baked as static
JSON files at build time, so the deployed site is fully static (no API server).

## Routes

| path | page |
|---|---|
| `/` | surface index — 12 SAE surfaces with summary stats |
| `/surface/:name` | filterable, sortable feature table for that surface |
| `/surface/:name/feature/:idx` | per-feature drilldown (top genes, Enrichr, niches, causal) |
| `/surface/:name/feature/:idx/spatial` | spatial projection of the feature on its top slide |
| `/surface/:name/modules` | Leiden modules + member features |
| `/about` | methodology, headline findings, citations |

## Local development

```bash
npm install
npm run dev          # http://localhost:5173/
```

The static data tree must exist at `public/data/` before `npm run dev`. Generate
or refresh it with the Python pipeline:

```bash
cd .. && python ../scripts/05_build_atlas_data.py
```

## Production build

```bash
npm run build        # → dist/
npm run preview      # serve dist/ locally for smoke-testing
```

The Vite config sets `base: '/novae-atlas/'` for production builds (matches the
GitHub Pages path). For local dev the base is `/`.

## Data layout

```
public/data/
  manifest.json                              # checkpoint, n_surfaces, n_features, n_cells
  surfaces.json                              # per-surface stats (var_exp, alive, n_modules)
  slides.json                                # 15 slides: tissue, technology, n_cells
  features/<surface>.json                    # slim per-surface table (feature × stats + bio + module)
  feature_detail/aggregator/<idx>.json       # full per-feature drilldown
  feature_detail/cell_embedder/<idx>.json    # full per-feature drilldown
  spatial/slide_<i>.json                     # ~5k cell background subsample (x, y, niche)
  spatial/feature/aggregator/<idx>.json      # top-cells coordinates for the spatial overlay
  modules/<surface>.json                     # Leiden modules + member feature ids
```

Conv layers (`conv_0`..`conv_9`) have only the slim table — no bio annotation
exists for them in the upstream pipeline. The frontend gracefully falls back to
the slim row when no detail file is present.

## Bundle size budget

| section | size | notes |
|---|---:|---|
| `manifest.json` + `surfaces.json` + `slides.json` | < 10 KB | bootstrap |
| `features/<surface>.json` | 50 KB – 4 MB | one per surface, lazy on navigation |
| `feature_detail/...` (aggregator + cell_embedder) | ~65 MB | lazy per click |
| `spatial/...` | ~40 MB | lazy on spatial-page navigation |
| `modules/...` | < 1 MB | lazy on modules-page navigation |
| **Total static bundle** | **~80 MB** | well under GitHub Pages 1 GB limit |

## Deployment to GitHub Pages

The `vite.config.js` sets `base: '/novae-atlas/'` for production. After `npm run
build`, push the contents of `dist/` to the `gh-pages` branch of
`Biodyn-AI/novae-atlas` (or use a GitHub Actions workflow). The atlas will be
served at `https://Biodyn-AI.github.io/novae-atlas/`.
