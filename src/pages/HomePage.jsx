import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Plot from 'react-plotly.js'
import { getGlobalSummary, getSpotlight, getFeatureSpatial, getSlides } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'
import { InfoIcon } from '../components/Tooltip.jsx'

const PLOTLY_LAYOUT_BASE = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { color: '#cbd5e1', family: 'Inter, sans-serif' },
  margin: { t: 16, r: 16, b: 40, l: 50 },
  xaxis: { gridcolor: '#1e293b', zerolinecolor: '#334155', tickcolor: '#475569', tickfont: { size: 10 } },
  yaxis: { gridcolor: '#1e293b', zerolinecolor: '#334155', tickcolor: '#475569', tickfont: { size: 10 } },
}

export default function HomePage() {
  const [summary, setSummary] = useState(null)
  const [spotlight, setSpotlight] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getGlobalSummary(), getSpotlight()])
      .then(([s, sp]) => {
        setSummary(s)
        setSpotlight(sp)
      })
      .catch(setError)
  }, [])

  if (error) return <ErrorBox error={error} />
  if (!summary || !spotlight) return <Loading what="atlas overview" />

  const flow = summary.depth_flow

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium ring-1 ring-brand-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          What does Novae actually learn?
        </div>
        <h1 className="text-5xl font-bold text-slate-50 tracking-tight max-w-4xl mx-auto leading-[1.05]">
          Investigate <span className="text-brand-300">{summary.n_total_features.toLocaleString()}</span>{' '}
          internal biological concepts found in{' '}
          <span className="text-purple-300">novae-human-0</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mt-5">
          This atlas decomposes Novae's internal representations into individual learned features
          and asks: do they correspond to recognizable biology? <strong className="text-slate-100">Spoiler: yes</strong> — and we
          can show you which cell types, gene programs, and spatial niches the model has internally
          discovered, without ever being explicitly told about any of them.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link to="/tour" className="btn-primary">
            Take the 2-minute tour →
          </Link>
          <Link to="/stories" className="btn">
            Read the stories
          </Link>
        </div>
      </section>

      {/* WHAT THIS IS — plain language */}
      <section className="card border-slate-700">
        <details open>
          <summary className="cursor-pointer text-base font-semibold text-slate-100 list-none flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What is this, in plain English?
          </summary>
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-slate-400 leading-relaxed">
            <div>
              <div className="font-semibold text-slate-200 mb-1">What is Novae?</div>
              A spatial-omics foundation model (Nature Methods 2025) that learns a 64-dimensional
              representation per cell, encoding the cell's identity in its spatial neighborhood.
              Used by biologists to discover spatial niches in their tissues.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-1">What is this atlas?</div>
              A decomposition of every internal layer of Novae into ~50,000 individual learned
              "features" — sparse linear directions that fire on coherent biological signals. Each
              feature gets an English label (e.g. "T Regulatory Cells"), gene markers, and a
              spatial map showing where it fires.
            </div>
            <div>
              <div className="font-semibold text-slate-200 mb-1">Why should I care?</div>
              You can audit whether Novae has learned the cell types and niches you care about,
              find which genes and spatial regions inform its representation, and check the model
              before applying it to your own data — all without retraining anything.
            </div>
          </div>
        </details>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Features"
          value={summary.n_total_features.toLocaleString()}
          tip="Total SAE dictionary elements across all 12 surfaces. Per-surface counts: aggregator/conv_9 = 2,048 each, conv_0..8 = 4,096 each, cell_embedder = 8,192."
        />
        <StatCard
          label="Alive"
          value={summary.n_alive.toLocaleString()}
          sub={`${(100 * summary.n_alive / summary.n_total_features).toFixed(1)}%`}
          tip="Features that activate at least once on the test corpus. Dead features never fire and are excluded from analysis."
        />
        <StatCard
          label="Cell types"
          value={summary.n_unique_celltypes}
          sub="PanglaoDB"
          tip="Distinct PanglaoDB cell types that appear as the top hit for at least one aggregator or cell_embedder feature. Multiple features can label the same type — see the Cell types page."
        />
        <StatCard
          label="Niches"
          value={summary.niche_significance.level_20.n_unique_niches}
          sub="level 20"
          tip="Number of distinct level-20 Novae niches that at least one aggregator SAE feature is enriched for. The hierarchy has 7 / 12 / 20 niches at three levels."
        />
        <StatCard
          label="Cells"
          value={`${(summary.n_total_cells / 1e6).toFixed(1)}M`}
          sub={`${summary.n_tissues} tissues`}
          tip={`${summary.n_total_cells.toLocaleString()} cells across ${summary.n_slides} slides, ${summary.n_tissues} tissues, ${summary.n_technologies} spatial-transcriptomics technologies (Xenium / MERSCOPE / CosMx).`}
        />
        <StatCard
          label="Genes indexed"
          value={summary.n_unique_genes_indexed.toLocaleString()}
          tip="Unique genes that appear in the top-20 of at least one aggregator or cell_embedder SAE feature. Use the Genes page to search by gene name."
        />
      </section>

      {/* USE THIS ATLAS TO… — two columns */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="card border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-md bg-emerald-500/20 ring-1 ring-emerald-500/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
            <div>
              <div className="text-base font-semibold text-slate-100">For biologists / bioinformaticians</div>
              <div className="text-xs text-slate-500">Audit and explore what the model knows</div>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            <UseLink to="/celltypes" title="Check whether Novae knows your cell types">
              178 distinct PanglaoDB cell types appear as the top hit for at least one feature.
              Browse to see if yours is there.
            </UseLink>
            <UseLink to="/niches" title="Find the spatial niches Novae defines in your tissue">
              Novae's hierarchical niches at 3 resolutions (7 / 12 / 92), each with auto-derived
              labels and the features that prefer them.
            </UseLink>
            <UseLink to="/genes" title="Test whether a gene of interest informs the model">
              Search 30,206 genes; see which features load on each one and how strongly.
            </UseLink>
            <UseLink to="/surface/aggregator" title="Discover co-occurring features that suggest new biology">
              Modules group features that fire on the same cells (Leiden communities). Co-occurring
              features sometimes reveal pathways the model has implicitly linked.
            </UseLink>
            <UseLink to="/tour" title="Audit before using Novae on your own data">
              Take the 2-minute tour to see exactly how to interrogate the model for any biology
              you care about.
            </UseLink>
          </ul>
        </div>

        <div className="card border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-md bg-purple-500/20 ring-1 ring-purple-500/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <div className="text-base font-semibold text-slate-100">For Novae developers</div>
              <div className="text-xs text-slate-500">Implications and takeaways for the model</div>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            <UseLink to="/celltypes" title={`${summary.n_unique_celltypes} cell types your model rediscovered without supervision`}>
              {summary.n_unique_celltypes} distinct PanglaoDB cell types appear as top hits — every
              one of them learned by SwAV alone, no cell-type labels in training.
            </UseLink>
            <UseLink to="/stories" title="97% of params are frozen, but ~1M trainable params encode all of this">
              Most of the model's weights live in a frozen pretrained gene-embedding table
              (~31M params). Only ~989k params are actually learned end-to-end on spatial data
              — yet they encode 49,152 distinct interpretable features.
            </UseLink>
            <UseLink to="/surfaces" title="Tech-confound rate drops 71% → 50% from conv_0 to conv_8">
              Your deeper GAT layers are progressively less technology-specific. The depth-flow
              chart below shows the full trajectory.
            </UseLink>
            <UseLink to="/niches" title="Two niches reach 100% feature concentration — your model's sharpest learned regions">
              Several aggregator features have 100% of their top cells in a single Novae niche
              (D948, D977). These are the most distinctive anatomical regions your SwAV head
              discovered.
            </UseLink>
            <UseLink to="/stories" title="Two-tier structure: gene programs vs spatial niches">
              Cell embedder features = clean cell-type identities (gene-program stratum). Aggregator
              features = spatial niches (cell-in-context stratum). The GAT layers are what
              transform one into the other.
            </UseLink>
          </ul>
        </div>
      </section>

      {/* HEADLINE FINDINGS CARDS */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">
          Headline findings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FindingCard
            color="brand"
            title="Niche specificity"
            stat={`${summary.niche_significance.level_20.n_features_log2enr_gt_2.toLocaleString()} features`}
            sub="log₂ enr > 2 vs corpus baseline"
            description="At the finest hierarchy (92 niches), 35% of aggregator features are >4× enriched for one specific Novae niche. Several features reach 100% concentration in a single niche."
            href="/niches"
          />
          <FindingCard
            color="green"
            title="Gene-program features"
            stat={`${summary.n_panglao_sig.aggregator + summary.n_panglao_sig.cell_embedder} features`}
            sub="significant PanglaoDB hit"
            description="91% of aggregator features and 100% of cell_embedder features have a statistically significant PanglaoDB cell-type hit. The cell_embedder surface gives clean cell-type identities, the aggregator gives spatial niches."
            href="/celltypes"
          />
          <FindingCard
            color="purple"
            title="Superposition"
            stat="99.4–100%"
            sub="features non-aligned with SVD"
            description="On every Novae surface, virtually all SAE features are non-aligned with the top SVD axes (cosine 0.7 threshold). The model uses directions that linear methods like PCA cannot find — feature dictionaries are essential for interpretation."
            href="/surfaces"
          />
          <FindingCard
            color="amber"
            title="Spatial coherence"
            stat="0.58"
            sub="mean Moran's I"
            description="94% of features have Moran's I > 0.1; mean = 0.58. Features are bona fide spatial niches, not cell-type indicators in disguise. Click any feature to see its spatial projection."
            href="/surface/aggregator"
          />
        </div>
      </section>

      {/* DEPTH FLOW CHART */}
      <section className="card">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center">
          Depth flow through the GAT stack
          <InfoIcon tip="As we go deeper through the GAT layers, variance explained climbs (the SAE captures more), the number of co-activation modules drops (concepts consolidate), and the technology-confound rate falls. The aggregator pool reaches 0.998 var_exp on the headline target." />
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          The unique Novae finding: spatial graph layers progressively compress activations into
          lower-rank, more SAE-friendly geometry, while becoming less technology-specific.
        </p>
        <DepthFlowChart flow={flow} />
      </section>

      {/* SIGNIFICANCE DISTRIBUTION */}
      {summary.significance_distribution && (
        <section className="card">
          <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center">
            How many features are statistically significant?
            <InfoIcon tip="Per-feature composite significance score combining PanglaoDB cell-type FDR and Novae niche enrichment. Score = -log₁₀(PanglaoDB FDR) + 5 × log₂(niche enrichment). Higher = more confident the feature represents real, specific biology." />
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Distribution of the composite significance score across the aggregator and cell_embedder
            surfaces. <strong className="text-brand-300">{summary.significance_distribution.aggregator.n_above_20}</strong> aggregator
            features score ≥ 20, <strong className="text-emerald-300">{summary.significance_distribution.aggregator.n_above_50}</strong> score ≥ 50.
            Use the "min sig" filter on any surface page to dial down to high-confidence features only.
          </p>
          <SignificanceHistogram dist={summary.significance_distribution} />
        </section>
      )}

      {/* FEATURED STORIES */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">
          Featured stories
        </h2>
        <p className="text-xs text-slate-500 mb-5 max-w-3xl">
          Four narratives that explain what this atlas tells us about Novae. Each story walks
          through the evidence and what it means — start here if you want to understand the value
          before browsing the data.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <StoryCard
            n="01"
            color="brand"
            title="Novae rediscovers kidney distal tubule biology"
            description="Feature 157 has, without supervision, learned the canonical AQP2 / GATA2 / ELF5 marker program for renal distal tubule cells — and it lights up the right anatomical region of the kidney slide."
            href="/stories?s=01"
          />
          <StoryCard
            n="02"
            color="green"
            title="Two regions Novae carved out with 100% specificity"
            description="Features 1633 and 878 each have every single one of their top cells in a single Novae niche. These are the model's sharpest learned anatomical structures — tonsillar crypt epithelium and stratified squamous epi."
            href="/stories?s=02"
          />
          <StoryCard
            n="03"
            color="purple"
            title="Two-tier structure: gene programs vs spatial niches"
            description="The pre-graph cell_embedder gives clean cell-type identities. The post-graph aggregator gives spatial niches. The GAT layers are what add the spatial-context layer — and we can see it happen in the data."
            href="/stories?s=03"
          />
          <StoryCard
            n="04"
            color="amber"
            title="Technology invariance increases with depth"
            description="The fraction of features that look 'technology-confounded' drops 71% → 50% from conv_0 to conv_8. The deeper GAT layers learn to be more invariant to whether the data came from Xenium, MERSCOPE, or CosMx."
            href="/stories?s=04"
          />
        </div>
      </section>

      {/* SPOTLIGHT FEATURES */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">
          Spotlight features
        </h2>
        <p className="text-xs text-slate-500 mb-5 max-w-3xl">
          10 textbook-perfect examples picked by joint significance (PanglaoDB FDR &lt; 1e-8 AND
          niche log₂ enr &gt; 5), deduped by cell type. Each is a feature where we have triple
          confirmation (gene markers + cell-type database + Novae's own niche assignment) plus a
          spatial map. Click any card to see the full drilldown.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spotlight.map((sp) => (
            <SpotlightCard key={sp.feature_idx} sp={sp} />
          ))}
        </div>
      </section>
    </div>
  )
}

function UseLink({ to, title, children }) {
  return (
    <li>
      <Link to={to} className="block group">
        <div className="font-semibold text-slate-100 group-hover:text-brand-300 leading-snug">
          {title}
          <span className="text-brand-400 ml-1 opacity-0 group-hover:opacity-100 transition">→</span>
        </div>
        <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{children}</div>
      </Link>
    </li>
  )
}

function SignificanceHistogram({ dist }) {
  const agg = dist.aggregator
  const ce = dist.cell_embedder
  const centers = agg.bin_edges.slice(0, -1).map((e, i) => (e + agg.bin_edges[i + 1]) / 2)
  return (
    <div className="pointer-events-none">
      <Plot
        data={[
          {
            x: centers,
            y: agg.counts,
            type: 'bar',
            name: 'aggregator',
            marker: { color: '#38bdf8', opacity: 0.85 },
          },
          {
            x: centers,
            y: ce.counts,
            type: 'bar',
            name: 'cell_embedder',
            marker: { color: '#a855f7', opacity: 0.85 },
          },
        ]}
        layout={{
          ...PLOTLY_LAYOUT_BASE,
          height: 260,
          barmode: 'group',
          xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: { text: 'significance score', font: { size: 11 } } },
          yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: { text: 'feature count', font: { size: 11 } } },
          showlegend: true,
          legend: { orientation: 'h', y: -0.25, font: { size: 10 } },
          margin: { l: 50, r: 16, t: 10, b: 60 },
          dragmode: false,
        }}
        config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
        useResizeHandler
        style={{ width: '100%' }}
      />
    </div>
  )
}

function StoryCard({ n, color, title, description, href }) {
  const colorMap = {
    brand: 'border-brand-500/40 hover:border-brand-400',
    green: 'border-emerald-500/40 hover:border-emerald-400',
    purple: 'border-purple-500/40 hover:border-purple-400',
    amber: 'border-amber-500/40 hover:border-amber-400',
  }
  const textMap = {
    brand: 'text-brand-300',
    green: 'text-emerald-300',
    purple: 'text-purple-300',
    amber: 'text-amber-300',
  }
  return (
    <Link to={href} className={`card transition block ${colorMap[color]}`}>
      <div className={`text-[10px] font-mono font-bold ${textMap[color]} mb-2`}>STORY {n}</div>
      <div className="font-semibold text-slate-100 leading-tight mb-2">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
    </Link>
  )
}

function StatCard({ label, value, sub, tip }) {
  return (
    <div className="card">
      <div className="stat-label flex items-center">
        {label}
        {tip && <InfoIcon tip={tip} />}
      </div>
      <div className="stat-value mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

const COLOR_CLASS = {
  brand: 'border-brand-500/40 hover:border-brand-400 hover:shadow-[0_0_24px_-6px_theme(colors.brand.500)]',
  green: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_24px_-6px_theme(colors.emerald.500)]',
  purple: 'border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_24px_-6px_theme(colors.purple.500)]',
  amber: 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_24px_-6px_theme(colors.amber.500)]',
}
const TEXT_CLASS = {
  brand: 'text-brand-300',
  green: 'text-emerald-300',
  purple: 'text-purple-300',
  amber: 'text-amber-300',
}

function FindingCard({ color, title, stat, sub, description, href }) {
  return (
    <Link to={href} className={`card transition block ${COLOR_CLASS[color]}`}>
      <div className={`text-2xl font-bold ${TEXT_CLASS[color]}`}>{stat}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{sub}</div>
      <div className="font-semibold text-slate-100 mt-3">{title}</div>
      <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</div>
    </Link>
  )
}

function DepthFlowChart({ flow }) {
  // Build per-trace y-arrays from the depth flow
  const x = flow.map((f) => f.surface)
  const varExp = flow.map((f) => f.var_exp_full)
  const nModules = flow.map((f) => f.n_modules)
  const techConf = flow.map((f) => (f.tech_confound_rate != null ? f.tech_confound_rate * 100 : null))

  const traces = [
    {
      x, y: varExp, name: 'var explained',
      type: 'scatter', mode: 'lines+markers',
      marker: { color: '#38bdf8', size: 8 },
      line: { color: '#38bdf8', width: 2 },
      yaxis: 'y',
      hovertemplate: '%{x}<br>var exp = %{y:.3f}<extra></extra>',
    },
    {
      x, y: techConf, name: 'tech-confound %',
      type: 'scatter', mode: 'lines+markers',
      marker: { color: '#fbbf24', size: 8 },
      line: { color: '#fbbf24', width: 2 },
      yaxis: 'y2',
      hovertemplate: '%{x}<br>tech-conf = %{y:.1f}%<extra></extra>',
    },
    {
      x, y: nModules, name: 'modules',
      type: 'scatter', mode: 'lines+markers',
      marker: { color: '#a855f7', size: 8 },
      line: { color: '#a855f7', width: 2 },
      yaxis: 'y3',
      hovertemplate: '%{x}<br>%{y} modules<extra></extra>',
    },
  ]

  return (
    <div className="pointer-events-none">
      <Plot
        data={traces}
        layout={{
          ...PLOTLY_LAYOUT_BASE,
          height: 320,
          showlegend: true,
          legend: { orientation: 'h', y: -0.18, font: { size: 11 } },
          xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, tickangle: -45 },
          yaxis: {
            ...PLOTLY_LAYOUT_BASE.yaxis,
            title: { text: 'var exp', font: { color: '#38bdf8', size: 11 } },
            tickfont: { color: '#38bdf8', size: 10 },
            range: [0.7, 1.01],
          },
          yaxis2: {
            ...PLOTLY_LAYOUT_BASE.yaxis,
            title: { text: 'tech-confound %', font: { color: '#fbbf24', size: 11 } },
            tickfont: { color: '#fbbf24', size: 10 },
            overlaying: 'y',
            side: 'right',
            showgrid: false,
          },
          yaxis3: {
            ...PLOTLY_LAYOUT_BASE.yaxis,
            title: { text: 'modules', font: { color: '#a855f7', size: 11 } },
            tickfont: { color: '#a855f7', size: 10 },
            overlaying: 'y',
            side: 'right',
            position: 0.94,
            showgrid: false,
            anchor: 'free',
          },
          margin: { t: 16, r: 60, b: 70, l: 50 },
          dragmode: false,
        }}
        config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
        useResizeHandler
        style={{ width: '100%' }}
      />
    </div>
  )
}

function SpotlightCard({ sp }) {
  return (
    <Link
      to={`/surface/${sp.surface}/feature/${sp.feature_idx}`}
      className="card-hover block group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-bold text-slate-100 leading-tight pr-2 group-hover:text-brand-300 transition">
          {sp.lb}
        </div>
        <span className="font-mono text-[10px] text-slate-500 shrink-0">
          f{sp.feature_idx}
        </span>
      </div>
      <div className="font-mono text-[11px] text-slate-400 mb-3 break-words">
        {sp.top_genes.split(',').slice(0, 5).join(', ').toUpperCase()}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">niche</div>
          <div className="text-slate-100 font-mono">{sp.niche}</div>
          <div className="text-slate-500">{(sp.niche_frac * 100).toFixed(0)}% · log₂ {sp.niche_log2enr.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">tissue</div>
          <div className="text-slate-100">{sp.tissue}</div>
          <div className="text-slate-500">{(sp.tissue_frac * 100).toFixed(0)}%</div>
        </div>
      </div>
    </Link>
  )
}
