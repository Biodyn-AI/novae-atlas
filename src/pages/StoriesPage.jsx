import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Plot from 'react-plotly.js'
import { getGlobalSummary, getFeatureSpatial, getSlideBackground, getSlides } from '../lib/data.js'
import { Loading } from '../components/Loading.jsx'

export default function StoriesPage() {
  const [summary, setSummary] = useState(null)
  const [searchParams] = useSearchParams()
  const requestedStory = searchParams.get('s')

  useEffect(() => {
    getGlobalSummary().then(setSummary)
  }, [])

  // Scroll to requested story on mount or when query param changes
  useEffect(() => {
    if (!requestedStory) return
    const id = `story-${requestedStory.padStart(2, '0')}`
    // Wait for the page to render (and any data fetches that affect layout)
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => clearTimeout(t)
  }, [requestedStory, summary])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-50 tracking-tight">Featured stories</h1>
        <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
          Four narratives that explain what this atlas reveals about Novae. Each story is a few
          paragraphs you can read in order, or jump to via the table of contents.
        </p>
      </div>

      {/* TOC */}
      <div className="card mb-12">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Stories</div>
        <ol className="space-y-2 text-sm list-none">
          <TocItem n="01" target="story-01">
            Novae rediscovers kidney distal tubule biology
          </TocItem>
          <TocItem n="02" target="story-02">
            Two regions Novae carved out with 100% specificity
          </TocItem>
          <TocItem n="03" target="story-03">
            Two-tier structure: gene programs vs spatial niches
          </TocItem>
          <TocItem n="04" target="story-04">
            Technology invariance increases with depth
          </TocItem>
        </ol>
      </div>

      {/* STORY 01 */}
      <Story id="story-01" n="01" color="brand" title="Novae rediscovers kidney distal tubule biology">
        <p>
          One of the most striking individual results in this atlas is{' '}
          <FeatureLink>feature 157</FeatureLink> in the aggregator surface. Novae has never been
          told what a "distal tubule cell" is — it was trained on a self-supervised SwAV
          objective with cluster prototypes, no anatomical labels at all. Yet feature 157 has
          internally learned exactly that concept.
        </p>
        <p>
          The top genes are <Code>AQP2, CDH16, STC1, GATA2, ELF5</Code>. AQP2 is the canonical
          vasopressin-regulated water channel of the renal collecting duct and distal nephron.
          GATA2 is a renal epithelial transcription factor expressed throughout collecting duct
          development. ELF5 is a distal-nephron differentiation marker. CDH16 (cadherin-16,
          a.k.a. KSP-cadherin) is the kidney-specific cadherin restricted to the distal tubule
          and collecting duct. Together, these are textbook markers of the same anatomical
          compartment.
        </p>
        <p>
          The independent confirmation chain is striking:
        </p>
        <ul className="list-disc list-inside ml-2 space-y-1 text-slate-300">
          <li><strong className="text-slate-100">PanglaoDB</strong> assigns "Distal Tubule Cells" with FDR 2 × 10⁻⁸</li>
          <li><strong className="text-slate-100">GO Biological Process</strong> top hit is "Glycerol Transmembrane Transport" (an aquaporin-mediated process)</li>
          <li><strong className="text-slate-100">Novae's own niche</strong> D980 contains 36% of the feature's top cells, ≈700× concentrated above baseline (FDR 8 × 10⁻¹⁶⁴)</li>
          <li><strong className="text-slate-100">Spatial</strong> projection on the kidney slide localizes the top cells to a tight anatomical region</li>
        </ul>
        <p>
          Four independent lines of evidence (gene markers, two ontology databases, the model's own
          self-discovered niche, plus the actual spatial pattern) all agree. This is not a coincidence —
          this is Novae demonstrating implicit knowledge of an anatomical structure it was never
          told about.
        </p>
        <Embed surface="aggregator" idx={157} caption="feature 157 — kidney distal tubule cells, on the kidney slide" />
        <p className="mt-4">
          <strong className="text-slate-100">Why this matters for biologists:</strong> you can now
          ask the same question of any cell type. Use the{' '}
          <Link to="/celltypes" className="text-brand-300 hover:underline">Cell Types</Link> browse
          to see all 178 PanglaoDB types Novae has internally rediscovered.
        </p>
        <p>
          <strong className="text-slate-100">Why this matters for Novae developers:</strong> the
          model knows about distal tubule cells <em>without</em> ever being trained on any cell-type
          label. This is implicit biological knowledge encoded in the SwAV prototype geometry. Your
          model has more inside it than its training objective directly enforced.
        </p>
      </Story>

      {/* STORY 02 */}
      <Story id="story-02" n="02" color="green" title="Two regions Novae carved out with 100% specificity">
        <p>
          Most SAE features are partially specific — they fire on a mix of related cell states
          across different niches. But two aggregator features are different:
        </p>
        <ul className="list-disc list-inside ml-2 space-y-1 text-slate-300">
          <li>
            <FeatureLink idx={1633}>Feature 1633</FeatureLink> has{' '}
            <strong className="text-slate-100">100% of its top cells in niche D948</strong>{' '}
            (log₂ enr ≈ 7.94, FDR ≈ 0). Top genes:{' '}
            <Code>C15orf48, S100A12, SerpinB2, GPRC5A, ALDH1A3</Code> — markers of
            tonsillar reactive crypt epithelium.
          </li>
          <li>
            <FeatureLink idx={878}>Feature 878</FeatureLink> has{' '}
            <strong className="text-slate-100">99.8% of its top cells in niche D977</strong>.
            Top genes: <Code>LY6D, FGFBP1, CLCA2, SerpinB3, KLK11</Code> — keratinocyte / stratified
            squamous epithelium markers. PanglaoDB confirms "Keratinocytes" at FDR 2 × 10⁻¹⁰.
          </li>
        </ul>
        <p>
          A 100% concentration is mathematically remarkable. The aggregator SAE was trained on 4.5M
          cells spanning 15 tissues — for a single feature to direct all its activation to one
          specific niche means the model has carved out an extremely sharp boundary in its
          internal geometry. These are the most distinctive learned anatomical structures in the
          atlas.
        </p>
        <Embed surface="aggregator" idx={1633} caption="feature 1633 — tonsillar reactive crypt epithelium, on the tonsil slide" />
        <p className="mt-4">
          <strong className="text-slate-100">Why this matters:</strong> you'd expect a clustering
          model trained on cells-in-context to mix nearby cell states (since neighbors share
          spatial signal). The fact that Novae has discovered some niches with perfect specificity
          means its learned representation is sharper than the training pressure would naively
          require. These features are high-confidence anatomical detectors. Browse all niches at{' '}
          <Link to="/niches" className="text-brand-300 hover:underline">/niches</Link>.
        </p>
      </Story>

      {/* STORY 03 */}
      <Story id="story-03" n="03" color="purple" title="Two-tier structure: gene programs vs spatial niches">
        <p>
          Novae has two main internal representations: the <Code>cell_embedder</Code> (a 512-dim
          frozen scGPT-initialized gene-projection layer) and the <Code>aggregator</Code> (the
          64-dim cell-in-niche pool that comes after 10 GAT layers of spatial integration).
          Decomposing both reveals a clean two-tier structure that wasn't obvious from looking at
          either layer in isolation:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 my-4">
          <div className="card border-purple-500/30">
            <div className="text-[10px] font-mono text-purple-300 mb-1">cell_embedder</div>
            <div className="font-semibold text-slate-100 mb-1">Clean cell-type identities</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              178 distinct PanglaoDB cell types as top hits. Top genes derived from direct
              decoder→gene projection, which bypasses any hub-gene bias.<br/>
              <span className="text-slate-500">Example: feature 2636 → Pulmonary VSMCs (COL1A1, ACTA2, EMILIN1, FDR 5 × 10⁻⁴⁴)</span>
            </div>
          </div>
          <div className="card border-brand-500/30">
            <div className="text-[10px] font-mono text-brand-300 mb-1">aggregator</div>
            <div className="font-semibold text-slate-100 mb-1">Spatial niches (cell-in-context)</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Same cell types appear, but enriched for specific Novae niches at level 20.
              Features here represent niches, not cell types in isolation.<br/>
              <span className="text-slate-500">Example: feature 157 → Distal Tubule Cells <em>in niche D980</em>, on the kidney slide</span>
            </div>
          </div>
        </div>
        <p>
          This is the spatial graph component doing real work. The cell_embedder reflects "what
          gene programs Novae sees in this cell". The aggregator reflects "what cell-in-niche
          context Novae assigns to it after looking at neighbors". The transformation from one
          to the other — across 10 GAT layers — is exactly the spatial integration the architecture
          is designed to do.
        </p>
        <p>
          <strong className="text-slate-100">Why this matters for biologists:</strong> if you care
          about "what cell type is this", look at cell_embedder features. If you care about "what
          spatial niche is this cell in", look at aggregator features. The atlas exposes both, so
          you can pick whichever question matches your research.
        </p>
        <p>
          <strong className="text-slate-100">Why this matters for Novae developers:</strong> you
          can now point to direct evidence of what the GAT stack is contributing on top of the
          frozen scGPT embedding. The 1M trainable parameters are doing spatial-context integration,
          and you can see the result in the difference between the two surfaces. Browse both at{' '}
          <Link to="/surfaces" className="text-brand-300 hover:underline">/surfaces</Link>.
        </p>
      </Story>

      {/* STORY 04 */}
      <Story id="story-04" n="04" color="amber" title="Technology invariance increases with depth">
        <p>
          The training corpus comes from three different spatial-transcriptomics platforms (Xenium,
          MERSCOPE, CosMx) with different gene panels, technical artifacts, and cell counts. A
          common worry is that a foundation model trained on a mixed corpus might over-fit to
          technology-specific signal — features that are really "this is a Xenium slide" rather
          than "this is a T cell".
        </p>
        <p>
          We measured this directly. For every SAE feature, we compute the fraction of its top-1%
          cells that come from a single technology. Features where one technology dominates are
          flagged as "tech-confounded". Then we plot the rate across the 12 hooked surfaces:
        </p>
        <DepthFlowMini summary={summary} />
        <p>
          The pattern is clean: tech-confound rate drops monotonically from 71% at conv_0 to 50% at
          conv_8 (then ticks up slightly at conv_9 / aggregator due to dimension compression).
          <strong className="text-slate-100"> Deeper GAT layers progressively learn to be more
          technology-invariant.</strong>
        </p>
        <p>
          Three other things track depth in the same direction:
        </p>
        <ul className="list-disc list-inside ml-2 space-y-1 text-slate-300">
          <li><strong className="text-slate-100">Variance explained</strong> by the SAE climbs 0.81 → 0.94 (deeper layers are more compressible into a few sparse directions)</li>
          <li><strong className="text-slate-100">Module count</strong> drops 313 → 44 (concepts consolidate into fewer, broader groups)</li>
          <li><strong className="text-slate-100">Per-layer dimensionality</strong> stays constant at 128 except for the final compression to 64 — yet the SAE-friendly geometry improves anyway</li>
        </ul>
        <p>
          Together these are consistent with a hypothesis: <em>the GAT stack progressively
          extracts a lower-rank, technology-invariant, niche-relevant subspace from the noisy
          per-cell input</em>. This is the spatial-graph analogue of the "early molecular machinery
          → late prediction-focused" hierarchy seen in the upstream Geneformer/scGPT analysis.
        </p>
        <p className="mt-4">
          <strong className="text-slate-100">Why this matters for Novae developers:</strong>{' '}
          this is empirical evidence that the GAT depth is doing what you'd want it to do — making
          the representation cleaner and more transferable. If you're considering training a
          shallower or wider variant, the depth-flow chart gives you a baseline to compare against.
          See the full chart on the home page or browse{' '}
          <Link to="/surfaces" className="text-brand-300 hover:underline">/surfaces</Link>.
        </p>
      </Story>

      <div className="text-center mt-10">
        <Link to="/" className="btn">← Back to overview</Link>
      </div>
    </div>
  )
}

function TocItem({ n, target, children }) {
  const handleClick = (e) => {
    e.preventDefault()
    const el = document.getElementById(target)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <li>
      <a href={`#${target}`} onClick={handleClick} className="flex items-baseline gap-3 group hover:text-brand-300">
        <span className="font-mono text-xs text-slate-500">{n}</span>
        <span className="text-slate-200 group-hover:text-brand-300">{children}</span>
      </a>
    </li>
  )
}

function Story({ id, n, color, title, children }) {
  const colorMap = {
    brand: 'border-brand-500/40',
    green: 'border-emerald-500/40',
    purple: 'border-purple-500/40',
    amber: 'border-amber-500/40',
  }
  const textMap = {
    brand: 'text-brand-300',
    green: 'text-emerald-300',
    purple: 'text-purple-300',
    amber: 'text-amber-300',
  }
  return (
    <section id={id} className={`scroll-mt-24 mb-16 pt-4`}>
      <div className={`text-[10px] font-mono font-bold ${textMap[color]} mb-2`}>STORY {n}</div>
      <h2 className="text-3xl font-bold text-slate-50 leading-tight tracking-tight mb-6">{title}</h2>
      <div className={`card ${colorMap[color]}`}>
        <div className="text-[15px] text-slate-300 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </section>
  )
}

function FeatureLink({ idx = 157, children }) {
  return (
    <Link to={`/surface/aggregator/feature/${idx}`} className="text-brand-300 hover:underline font-mono">
      {children || `feature ${idx}`}
    </Link>
  )
}

function Code({ children }) {
  return (
    <code className="bg-slate-800 px-1.5 py-0.5 rounded text-brand-300 text-[13px] font-mono">
      {children}
    </code>
  )
}

function Embed({ surface, idx, caption }) {
  const [topCells, setTopCells] = useState(null)
  const [bg, setBg] = useState(null)
  const [slideIdx, setSlideIdx] = useState(null)

  useEffect(() => {
    Promise.all([getFeatureSpatial(surface, idx), getSlides()])
      .then(([cells]) => {
        setTopCells(cells)
        const counts = {}
        for (const c of cells) counts[c.slide_idx] = (counts[c.slide_idx] || 0) + 1
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        if (best) setSlideIdx(Number(best[0]))
      })
      .catch(console.error)
  }, [surface, idx])

  useEffect(() => {
    if (slideIdx == null) return
    getSlideBackground(slideIdx).then(setBg).catch(console.error)
  }, [slideIdx])

  if (!topCells || !bg) return null
  const slideTop = topCells.filter((t) => t.slide_idx === slideIdx)

  return (
    <div className="card !p-2 mt-4">
      <div className="pointer-events-none">
        <Plot
          data={[
            {
              type: 'scattergl',
              mode: 'markers',
              x: bg.x,
              y: bg.y,
              marker: { size: 1.6, color: '#334155', opacity: 0.6 },
              hoverinfo: 'skip',
              showlegend: false,
            },
            {
              type: 'scattergl',
              mode: 'markers',
              x: slideTop.map((t) => t.x),
              y: slideTop.map((t) => t.y),
              marker: {
                size: 6,
                color: slideTop.map((t) => Math.abs(t.a)),
                colorscale: 'Inferno',
                line: { width: 0.4, color: '#0f172a' },
              },
              hoverinfo: 'skip',
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            height: 360,
            paper_bgcolor: 'transparent',
            plot_bgcolor: '#020617',
            xaxis: { scaleanchor: 'y', showgrid: false, zeroline: false, showticklabels: false },
            yaxis: { showgrid: false, zeroline: false, autorange: 'reversed', showticklabels: false },
            margin: { l: 5, r: 5, t: 5, b: 5 },
            dragmode: false,
          }}
          config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </div>
      <div className="text-[10px] text-slate-500 text-center pb-1">{caption}</div>
    </div>
  )
}

function DepthFlowMini({ summary }) {
  if (!summary) return null
  const flow = summary.depth_flow
  const x = flow.map((f) => f.surface)
  const techConf = flow.map((f) => (f.tech_confound_rate != null ? f.tech_confound_rate * 100 : null))
  const varExp = flow.map((f) => (f.var_exp_full != null ? f.var_exp_full : null))
  return (
    <div className="card !p-2 mt-3 mb-3">
      <div className="pointer-events-none">
        <Plot
          data={[
            {
              x, y: techConf, name: 'tech-confound %',
              type: 'scatter', mode: 'lines+markers',
              marker: { color: '#fbbf24', size: 8 },
              line: { color: '#fbbf24', width: 2 },
              yaxis: 'y',
            },
            {
              x, y: varExp, name: 'var explained',
              type: 'scatter', mode: 'lines+markers',
              marker: { color: '#38bdf8', size: 8 },
              line: { color: '#38bdf8', width: 2 },
              yaxis: 'y2',
            },
          ]}
          layout={{
            autosize: true,
            height: 280,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#cbd5e1', family: 'Inter, sans-serif', size: 10 },
            xaxis: { tickangle: -45, gridcolor: '#1e293b' },
            yaxis: {
              title: { text: 'tech-confound %', font: { color: '#fbbf24' } },
              tickfont: { color: '#fbbf24' },
              gridcolor: '#1e293b',
            },
            yaxis2: {
              title: { text: 'var exp', font: { color: '#38bdf8' } },
              tickfont: { color: '#38bdf8' },
              overlaying: 'y',
              side: 'right',
              range: [0.7, 1.01],
              showgrid: false,
            },
            showlegend: true,
            legend: { orientation: 'h', y: -0.25, font: { size: 10 } },
            margin: { l: 50, r: 50, t: 10, b: 60 },
            dragmode: false,
          }}
          config={{ displayModeBar: false, responsive: true, staticPlot: true, scrollZoom: false }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
