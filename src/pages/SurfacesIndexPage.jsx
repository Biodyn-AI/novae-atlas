import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSurfaces } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

const SURFACE_DESCRIPTIONS = {
  cell_embedder:
    "Pre-graph gene-projection layer. SAE features here capture clean cell-type identities via direct decoder→gene projection — the gene-program stratum.",
  conv_0: 'GAT layer 0 (input from cell_embedder). 128-dim, 16 heads.',
  conv_1: 'GAT layer 1. 128-dim, 16 heads.',
  conv_2: 'GAT layer 2. 128-dim, 16 heads.',
  conv_3: 'GAT layer 3. 128-dim, 16 heads.',
  conv_4: 'GAT layer 4. 128-dim, 16 heads.',
  conv_5: 'GAT layer 5. 128-dim, 16 heads.',
  conv_6: 'GAT layer 6. 128-dim, 16 heads.',
  conv_7: 'GAT layer 7. 128-dim, 16 heads.',
  conv_8: 'GAT layer 8. 128-dim, 16 heads.',
  conv_9: 'Compression GAT layer (128 → 64). The final per-node representation before the aggregator pool.',
  aggregator:
    "AttentionAggregation pool — the canonical 'cell-in-niche' representation, identical to obsm['novae_latent']. The headline SAE target.",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">
          12 SAE surfaces
        </h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          Each surface is a hooked layer of <span className="font-mono text-brand-300">novae-human-0</span>{' '}
          where a TopK SAE was trained at 32× expansion. The aggregator surface is the canonical
          cell-in-niche representation; the cell_embedder surface is the pre-graph gene projection.
        </p>
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
  return (
    <Link to={`/surface/${surface.name}`} className="card-hover block">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-100">{surface.name}</span>
          {isHeadline && <span className="pill-blue">headline</span>}
          {isCellEmb && <span className="pill-purple">bio</span>}
        </div>
        <span className="font-mono text-[10px] text-slate-500">d={surface.d}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.2rem] leading-relaxed">
        {SURFACE_DESCRIPTIONS[surface.name] || ''}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="features" value={surface.n_features.toLocaleString()} />
        <MiniStat
          label="var exp"
          value={surface.var_exp_full != null ? surface.var_exp_full.toFixed(3) : '—'}
        />
        <MiniStat label="modules" value={surface.n_modules ?? '—'} />
      </div>
    </Link>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-200 tabular-nums">{value}</div>
    </div>
  )
}
