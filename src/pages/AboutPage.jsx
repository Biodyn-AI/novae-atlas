export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-slate-50 tracking-tight mb-6">About this atlas</h1>

      <p className="text-slate-300 leading-relaxed text-base">
        This is a sparse-autoencoder atlas of <strong className="text-slate-100">novae-human-0</strong>,
        the human checkpoint of the Novae spatial-omics foundation model published in{' '}
        <a className="text-brand-300 hover:underline" href="https://www.nature.com/articles/s41592-025-02899-6" target="_blank" rel="noopener">
          Nature Methods 2025
        </a>. We trained sparse-autoencoder interpreters on every internal layer of Novae and
        characterized every learned feature with gene markers, cell-type databases, Novae's own
        hierarchical niches, causal ablation, and spatial coherence — to find out{' '}
        <em>what the model has actually learned about biology</em>.
      </p>

      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-3">Pipeline</h2>
      <p className="text-slate-300 leading-relaxed">
        The pipeline replicates and adapts the methodology of{' '}
        <a className="text-brand-300 hover:underline" href="https://arxiv.org/abs/2603.02952" target="_blank" rel="noopener">
          arXiv:2603.02952
        </a>{' '}
        — TopK SAEs hooked at every internal surface of the model, characterized via top-cell gene
        markers, Enrichr enrichment, and superposition geometry. The Novae-specific additions are
        the niche-based characterization (no analogue in single-cell models), the spatial coherence
        tests via Moran's I, and the per-feature spatial projections.
      </p>
      <ol className="text-slate-300 leading-relaxed list-decimal list-inside space-y-1 ml-2 mt-3">
        <li><strong className="text-slate-100">Phase 1</strong> — activation extraction across 12 surfaces on 4.5M cells × 15 tissues × 3 technologies</li>
        <li><strong className="text-slate-100">Phase 2</strong> — TopK SAE training at 32× expansion (k=16 or k=32 per surface)</li>
        <li><strong className="text-slate-100">Phase 3</strong> — characterization (variance explained, alive features, superposition vs SVD)</li>
        <li><strong className="text-slate-100">Phase 3b</strong> — Leiden module discovery on the PMI co-activation graph</li>
        <li><strong className="text-slate-100">Phase 3c</strong> — gene markers via fold-change ranking + 5-library Enrichr enrichment</li>
        <li><strong className="text-slate-100">Phase 3d / 3c v3</strong> — Novae niche assignment + niche enrichment at 3 hierarchy levels</li>
        <li><strong className="text-slate-100">Phase 4</strong> — causal validation via single-feature ablation + Moran's I spatial coherence</li>
      </ol>

      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-3">Headline findings</h2>
      <ul className="text-slate-300 leading-relaxed list-disc list-inside space-y-2 ml-2">
        <li><strong className="text-slate-100">Superposition replicated</strong> — 99.4–100% of SAE features are non-aligned with top SVD axes. Direct match to the upstream 99.8% finding for Geneformer / scGPT. Spatial models are not exempt from superposition.</li>
        <li><strong className="text-slate-100">Spatial coherence confirmed</strong> — mean Moran's I = 0.58, 94% of features &gt; 0.1. Features are bona fide spatial niches, not cell-type indicators in disguise.</li>
        <li><strong className="text-slate-100">Depth-monotonic compressibility (new)</strong> — variance explained climbs 0.81 → 0.94 from conv_0 to conv_8, module count drops 313 → 44, tech-confound rate drops 71% → 50%. The deeper GAT layers are more interpretable, more compressible, and less technology-specific.</li>
        <li><strong className="text-slate-100">Causal poverty</strong> — mean single-feature ablation effect 0.005 cosine. Spatial analogue of the upstream "minimal regulatory logic" finding. Individual features carry little causal weight; redundancy is high.</li>
        <li><strong className="text-slate-100">Niche specificity</strong> — at level-20 (finest) niches, 35% of aggregator features are &gt;4× enriched for one specific Novae niche. Several features hit 100% concentration.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-3">Glossary</h2>
      <p className="text-slate-400 text-sm mb-4">
        Every technical term in the atlas, in one sentence.
      </p>
      <dl className="space-y-3">
        {GLOSSARY.map(({ term, def }) => (
          <div key={term} className="card !p-4">
            <dt className="font-semibold text-slate-100 font-mono text-sm">{term}</dt>
            <dd className="text-sm text-slate-400 mt-1 leading-relaxed">{def}</dd>
          </div>
        ))}
      </dl>

      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-3">Citation</h2>
      <p className="text-slate-300 leading-relaxed">
        If you use this atlas, please cite both the Novae paper and the upstream methodology paper:
      </p>
      <div className="card !p-4 mt-3 text-xs font-mono text-slate-300 leading-relaxed">
        Blampey, Q. et al. <em>Novae: a graph-based foundation model for spatial transcriptomics
        data.</em> Nature Methods (2025).
        <br /><br />
        Kendiukhov, I. <em>Comparative SAE atlas of Geneformer and scGPT single-cell foundation
        models.</em> arXiv:2603.02952 (2025).
      </div>

      <h2 className="text-xl font-bold text-slate-100 mt-10 mb-3">Source</h2>
      <p className="text-slate-300 leading-relaxed">
        Atlas generation pipeline:{' '}
        <a className="text-brand-300 hover:underline" href="https://github.com/Biodyn-AI/novae-atlas" target="_blank" rel="noopener">
          github.com/Biodyn-AI/novae-atlas
        </a>
      </p>
    </div>
  )
}

const GLOSSARY = [
  {
    term: 'SAE feature',
    def: 'A sparse linear direction in one of Novae\'s internal activation spaces, learned by a small "interpreter" network (the sparse autoencoder). Each feature fires on a coherent biological signal — think of it as one channel of meaning the model uses internally. ~30 features fire per cell out of ~50,000 total.',
  },
  {
    term: 'Sparse autoencoder (SAE)',
    def: 'A small two-layer network — encoder, then decoder — trained to reconstruct an activation vector while only allowing a handful of "features" to fire at once (sparsity). The features become interpretable because each one has to encode a coherent, isolated concept to fit into the sparsity budget.',
  },
  {
    term: 'Surface (model surface)',
    def: 'A specific internal layer of Novae where we hooked an SAE. There are 12 surfaces total: cell_embedder (the gene-projection input), conv_0..9 (the 10 GAT layers), and aggregator (the final cell-in-niche pool).',
  },
  {
    term: 'Aggregator',
    def: 'The headline surface — Novae\'s AttentionAggregation pool that produces the canonical 64-dimensional cell-in-niche representation. This is exactly what you get back from Novae as obsm["novae_latent"].',
  },
  {
    term: 'Cell embedder',
    def: 'The pre-graph layer — a frozen 512-dimensional gene-projection initialized from scGPT. SAE features here capture clean cell-type identities because the layer has not yet been "mixed" by the spatial graph.',
  },
  {
    term: 'Top cells (top-N cells)',
    def: 'For a given feature, the cells where it activates most strongly. We use the top 0.1% (~4,500 cells) for characterization. The feature is "about" whatever these cells have in common.',
  },
  {
    term: 'Top genes',
    def: 'The genes most highly expressed in a feature\'s top cells, ranked by fold-change vs corpus baseline (not absolute expression — see fold change). These are the marker genes of whatever the feature encodes.',
  },
  {
    term: 'Fold change',
    def: 'How many times more a gene is expressed in a feature\'s top cells compared to a random sample of the corpus. Ranking by fold change instead of absolute expression avoids "hub gene" artifacts where universal markers (like EPCAM) dominate every feature.',
  },
  {
    term: 'PanglaoDB / CellMarker',
    def: 'Independent cell-type marker databases — gene→cell-type mappings curated by humans from published literature. We test whether each SAE feature\'s top genes match a cell type in these databases (Fisher\'s exact test). Match → the feature is "about" that cell type. Independent of Novae\'s training.',
  },
  {
    term: 'GO BP / KEGG / Reactome',
    def: 'Functional ontology databases — gene→biological-process / pathway mappings. Used the same way as PanglaoDB but for testing pathway-level identity (e.g., "this feature is about glycerol transmembrane transport") rather than cell-type identity.',
  },
  {
    term: 'FDR (false discovery rate)',
    def: 'A multiple-testing-corrected p-value. FDR < 0.05 means "this match is unlikely to be due to chance". We use Benjamini-Hochberg correction across all tested features.',
  },
  {
    term: 'Niche / Novae niche',
    def: 'A spatial neighborhood "type" Novae has internally discovered via its SwAV prototype head, without being told about anatomy. Novae produces a hierarchy at three levels: 7 broad niches → 12 mid-level → 92 fine-grained. Each niche has a global identifier like "D948" and an auto-derived English label from its dominant feature.',
  },
  {
    term: 'log₂ enrichment (niche)',
    def: 'How many times more a feature\'s top cells concentrate in its top niche, vs the corpus baseline rate of that niche. Log₂ = 1 means 2×, log₂ = 5 means 32×, log₂ = 9 means 512×. Most features cluster at log₂ 1–3; a few outliers reach 9+.',
  },
  {
    term: 'Module',
    def: 'A community of co-activating SAE features, found by Leiden clustering on the PMI co-activation graph. Features in the same module fire on the same cells, suggesting they encode related concepts (e.g., a "cell cycle" module).',
  },
  {
    term: 'Alive feature',
    def: 'A feature that fires on at least one cell. "Dead" features never activate and are excluded from analysis. 49,151 of 49,152 features in this atlas are alive.',
  },
  {
    term: 'Variance explained',
    def: 'How much of the original activation variance the SAE reconstruction captures. 1.0 = perfect, 0 = none. The aggregator surface reaches 0.998 (essentially perfect); the deepest GAT layers reach 0.94+.',
  },
  {
    term: 'Superposition / SVD-aligned',
    def: 'A finding that SAE features are mostly NOT aligned with the top principal components (SVD axes) of the activations. 99.4% of SAE features have cosine < 0.7 with any top-50 SVD axis, meaning the model is using directions that linear methods (like PCA) cannot easily find. The headline "superposition" result of mechanistic interpretability.',
  },
  {
    term: "Moran's I",
    def: 'A measure of spatial autocorrelation. Moran\'s I close to 1 means a feature lights up spatially-adjacent cells together (a real spatial pattern). Close to 0 means scattered. Most aggregator features here score 0.5+ → genuine spatial niches.',
  },
  {
    term: 'Tech-confounded',
    def: 'A feature where most of its top cells come from a single technology (Xenium, MERSCOPE, or CosMx). May reflect a real technology-specific pattern, or just bias from the corpus tissue mix. Lower confound rate at deeper GAT layers suggests the model learns to be technology-invariant.',
  },
  {
    term: 'Causal ablation',
    def: 'A counterfactual test — we zero out one feature and ask how much the model\'s output changes. Mean effect ~0.005 cosine across all features means no individual feature is causally indispensable; the representation is highly redundant.',
  },
  {
    term: 'TopK sparsity',
    def: 'A specific kind of SAE that enforces sparsity by hard-keeping only the top-k features per input (k = 16 or 32 here). Trains better than soft-sparsity (L1) and gives cleaner features.',
  },
]
