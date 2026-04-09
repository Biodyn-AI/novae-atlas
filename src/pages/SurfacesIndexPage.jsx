import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSurfaces } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'
import { InfoIcon } from '../components/Tooltip.jsx'

const SURFACE_DESCRIPTIONS = {
  cell_embedder: {
    role: 'Pre-graph gene-projection layer',
    text: 'Each gene gets a 512-dim learned vector. SAE features here capture clean cell-type identities — they fire on specific gene programs before the spatial graph mixes information across neighbors.',
  },
  conv_0: { role: 'GAT layer 0 — first spatial integration', text: 'The first graph attention layer takes the per-cell gene projection and starts mixing in information from neighboring cells.' },
  conv_1: { role: 'GAT layer 1', text: 'Second spatial integration step. Features here are still close to per-cell gene programs.' },
  conv_2: { role: 'GAT layer 2', text: 'Mid-stack: features become slightly broader, drawing on a wider neighborhood.' },
  conv_3: { role: 'GAT layer 3', text: 'Mid-stack continued. Variance-explained climbs as the representation becomes more compressible.' },
  conv_4: { role: 'GAT layer 4', text: 'Halfway through the stack. Module count starts dropping (concepts consolidate).' },
  conv_5: { role: 'GAT layer 5', text: 'Past the midpoint. Tech-confound rate begins to fall.' },
  conv_6: { role: 'GAT layer 6', text: 'Approaching the back of the stack. Features become increasingly cell-in-niche-aware.' },
  conv_7: { role: 'GAT layer 7', text: 'Late stack. Representations are now mostly about spatial niches, not bare gene programs.' },
  conv_8: { role: 'GAT layer 8', text: 'Penultimate full-width layer. Highest variance-explained among the GAT layers (~0.94).' },
  conv_9: {
    role: 'Compression layer (128 → 64)',
    text: 'The final GAT layer compresses 128-dim representations down to 64-dim. This is the last per-cell representation before the aggregator pool.',
  },
  aggregator: {
    role: 'Cell-in-niche aggregator (HEADLINE)',
    text: "AttentionAggregation pool — the canonical 64-dim cell-in-niche representation. Bit-equal to obsm['novae_latent'] from the published Novae API. SAE features here represent spatial niches with strong concentration in Novae's own discovered domains.",
  },
}

export default function SurfacesIndexPage() {
  const [surfaces, setSurfaces] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSurfaces().then(setSurfaces).catch(setError)
  }, [])

  if (error) return <ErrorBox error={error} />
  if (!surfaces) return <Loading what="surfaces" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">12 SAE surfaces</h1>
        <p className="text-slate-400 mt-3 max-w-3xl leading-relaxed">
          A "surface" is a hooked layer inside Novae where we trained an interpreter network
          (sparse autoencoder). Novae has 12 internal layers we can see into: a pre-graph
          gene-projection (<span className="font-mono text-slate-300">cell_embedder</span>),
          ten graph-attention layers (<span className="font-mono text-slate-300">conv_0..9</span>),
          and the final cell-in-niche pool (<span className="font-mono text-slate-300">aggregator</span>).
          Each surface gets its own dictionary of features.
        </p>
      </div>

      <div className="card border-slate-700 mb-8">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 list-none flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Why open up all 12 layers?
            <span className="text-xs text-slate-500 ml-auto">click to expand</span>
          </summary>
          <div className="mt-4 text-sm text-slate-400 leading-relaxed space-y-3">
            <p>
              Novae has ~32M parameters total, but only ~989k of them are actually <em>trained</em>{' '}
              on spatial data (the gene-embedding table is frozen pretrained). Looking at all 12
              hooked surfaces lets us see <strong className="text-slate-200">how the
              representation changes as it flows through the model</strong> — from raw gene
              projections at the input, to spatially-integrated cell-in-niche embeddings at the output.
            </p>
            <p>
              The two surfaces most useful for biology:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><span className="font-mono text-purple-300">cell_embedder</span> — features map cleanly to <strong className="text-slate-200">cell types</strong> (T cells, fibroblasts, etc.) because the layer hasn't been mixed by the graph yet.</li>
              <li><span className="font-mono text-brand-300">aggregator</span> — features map to <strong className="text-slate-200">spatial niches</strong> (a tonsillar follicle, a renal distal tubule, etc.) because the graph has integrated context from neighboring cells.</li>
            </ul>
            <p>
              The 10 conv layers in between are the spatial-integration mechanism. Looking at how
              metrics evolve across the stack (variance-explained climbing, modules consolidating,
              tech-confound dropping) tells us what each layer is contributing.
            </p>
          </div>
        </details>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {surfaces.map((s) => (
          <SurfaceCard key={s.name} surface={s} />
        ))}
      </div>
    </div>
  )
}

function SurfaceCard({ surface }) {
  const isHeadline = surface.name === 'aggregator'
  const isCellEmb = surface.name === 'cell_embedder'
  const desc = SURFACE_DESCRIPTIONS[surface.name] || { role: '', text: '' }
  return (
    <Link to={`/surface/${surface.name}`} className="card-hover block">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-100">{surface.name}</span>
          {isHeadline && <span className="pill-blue">headline</span>}
          {isCellEmb && <span className="pill-purple">bio</span>}
        </div>
        <span className="font-mono text-[10px] text-slate-500">d={surface.d ?? '?'}</span>
      </div>
      <div className="text-[11px] font-semibold text-slate-300 mb-1">{desc.role}</div>
      <p className="text-xs text-slate-500 mb-4 line-clamp-3 min-h-[3.2rem] leading-relaxed">
        {desc.text}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          label="features"
          value={surface.n_features.toLocaleString()}
          tip="Number of SAE dictionary elements at this surface. Higher = finer-grained decomposition."
        />
        <MiniStat
          label="var exp"
          value={surface.var_exp_full != null ? surface.var_exp_full.toFixed(3) : '—'}
          tip="Variance explained — how much of the original activation the SAE reconstruction captures. 1.0 = perfect, higher = better. The aggregator reaches 0.998."
        />
        <MiniStat
          label="modules"
          value={surface.n_modules ?? '—'}
          tip="Number of co-active feature communities found by Leiden clustering on the PMI co-activation graph. Lower = more concentrated, higher-level concepts."
        />
      </div>
    </Link>
  )
}

function MiniStat({ label, value, tip }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-slate-500 flex items-center gap-0.5">
        {label}
        {tip && <InfoIcon tip={tip} />}
      </div>
      <div className="text-sm font-semibold text-slate-200 tabular-nums">{value}</div>
    </div>
  )
}
