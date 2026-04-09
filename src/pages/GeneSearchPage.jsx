import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getGeneIndex, getFeatureTable, getGeneCCC } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function GeneSearchPage() {
  const navigate = useNavigate()
  const { symbol } = useParams()
  const [index, setIndex] = useState(null)
  const [ccc, setCCC] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [labelLookup, setLabelLookup] = useState({})

  useEffect(() => {
    setError(null)
    Promise.all([
      getGeneIndex(),
      getFeatureTable('aggregator'),
      getFeatureTable('cell_embedder'),
      getGeneCCC(),
    ])
      .then(([idx, agg, ce, c]) => {
        setIndex(idx)
        setCCC(c)
        const lk = {}
        for (const f of agg) lk[`aggregator/${f.feature_idx}`] = f.lb
        for (const f of ce) lk[`cell_embedder/${f.feature_idx}`] = f.lb
        setLabelLookup(lk)
      })
      .catch(setError)
  }, [])

  // Sync query input with URL param
  useEffect(() => {
    if (symbol) setQuery(symbol.toUpperCase())
  }, [symbol])

  const allGenes = useMemo(() => (index ? Object.keys(index).sort() : []), [index])

  const suggestions = useMemo(() => {
    if (!query || !index || symbol === query.toUpperCase()) return []
    const q = query.toUpperCase()
    return allGenes.filter((g) => g.includes(q)).slice(0, 12)
  }, [query, allGenes, index, symbol])

  // Selected gene comes from the URL param
  const selectedGene = symbol ? symbol.toUpperCase() : null
  const featureResults = useMemo(() => {
    if (!selectedGene || !index) return null
    return index[selectedGene] ?? []
  }, [selectedGene, index])

  const cccResults = useMemo(() => {
    if (!selectedGene || !ccc) return null
    return ccc[selectedGene] ?? []
  }, [selectedGene, ccc])

  if (error) return <ErrorBox error={error} />
  if (!index) return <Loading what="gene index" />

  function selectGene(g) {
    navigate(`/genes/${encodeURIComponent(g)}`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Gene search</h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          Search any of the <span className="text-brand-300">{allGenes.length.toLocaleString()}</span>{' '}
          unique genes that appear in the top-20 of at least one aggregator or cell_embedder SAE
          feature, or any of the <span className="text-brand-300">{ccc ? Object.keys(ccc).length.toLocaleString() : '?'}</span>{' '}
          ligands and receptors that participate in cell-cell communication within Novae niches.
          Click a gene to see how the model uses it.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a gene name (e.g. AQP2, FOXP3, CTLA4, MS4A1, GATA2)…"
          className="input !text-lg !py-3 !px-5"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) selectGene(suggestions[0])
          }}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-30 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            {suggestions.map((g) => (
              <li key={g}>
                <button
                  onClick={() => selectGene(g)}
                  className="w-full text-left px-5 py-2 hover:bg-brand-500/10 font-mono text-sm text-slate-200"
                >
                  {g}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedGene && (
        <div className="space-y-8">
          {/* Gene header + external links */}
          <div>
            <h2 className="text-4xl font-bold text-slate-50 font-mono tracking-tight">
              {selectedGene}
            </h2>
            <p className="text-slate-500 text-sm mt-1 mb-4">
              {(featureResults?.length || 0)} SAE features ·{' '}
              {(cccResults?.length || 0)} L-R interactions in Novae niches
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">external resources</span>
              <ExtLink href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${selectedGene}`}>GeneCards</ExtLink>
              <ExtLink href={`https://www.ncbi.nlm.nih.gov/gene/?term=${selectedGene}%5Bgene%5D+AND+human%5Borgn%5D`}>NCBI Gene</ExtLink>
              <ExtLink href={`https://www.uniprot.org/uniprotkb?query=${selectedGene}+AND+organism_id:9606`}>UniProt</ExtLink>
              <ExtLink href={`https://www.proteinatlas.org/search/${selectedGene}`}>Human Protein Atlas</ExtLink>
              <ExtLink href={`https://www.genenames.org/tools/search/#!/?query=${selectedGene}`}>HGNC</ExtLink>
            </div>
          </div>

          {/* SAE features that load on this gene */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-2">
              SAE features that load on {selectedGene}
              <span className="text-slate-600 normal-case font-normal text-[10px]">
                ({featureResults?.length || 0})
              </span>
            </h3>
            {!featureResults || featureResults.length === 0 ? (
              <div className="card text-center text-slate-500 text-sm py-6">
                No SAE features have {selectedGene} in their top-20 by fold-change.
              </div>
            ) : (
              <div className="card !p-0 overflow-hidden">
                <table className="atlas">
                  <thead>
                    <tr>
                      <th>surface</th>
                      <th>idx</th>
                      <th>label</th>
                      <th>score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureResults.map((r, i) => {
                      const lb = labelLookup[`${r.s}/${r.i}`]
                      return (
                        <tr
                          key={i}
                          className="cursor-pointer"
                          onClick={() => navigate(`/surface/${r.s}/feature/${r.i}`)}
                        >
                          <td>
                            <span className={r.s === 'aggregator' ? 'pill-blue' : 'pill-purple'}>
                              {r.s}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-brand-300">f{r.i}</td>
                          <td className="font-semibold text-slate-100">{lb || 'Unannotated'}</td>
                          <td className="font-mono tabular-nums text-brand-300">
                            {r.metric === 'fc' ? `${r.score.toFixed(1)}×` : r.score.toFixed(3)}
                          </td>
                          <td className="text-right text-brand-400 text-xs">→</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* L-R interactions in Novae niches */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-2">
              Cell-cell communication interactions
              <span className="text-slate-600 normal-case font-normal text-[10px]">
                ({cccResults?.length || 0})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-3 max-w-3xl leading-relaxed">
              Niches where {selectedGene} acts as a ligand or receptor in a high-enrichment L-R pair,
              from the LIANA consensus database mapped onto Novae's hierarchical niches. Click a row
              to jump to the niche detail page.
            </p>
            {!cccResults || cccResults.length === 0 ? (
              <div className="card text-center text-slate-500 text-sm py-6">
                {selectedGene} is not in the LIANA consensus L-R database, or none of the niches
                where it could act have measurable signal.
              </div>
            ) : (
              <div className="card !p-0 overflow-hidden">
                <table className="atlas">
                  <thead>
                    <tr>
                      <th>role</th>
                      <th>partner</th>
                      <th>niche</th>
                      <th>level</th>
                      <th>enr</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cccResults.map((r, i) => (
                      <tr
                        key={i}
                        className="cursor-pointer"
                        onClick={() => navigate(`/niches/level_${r.level}/${r.niche}`)}
                      >
                        <td>
                          <span className={r.role === 'ligand' ? 'pill-green' : 'pill-amber'}>
                            {r.role}
                          </span>
                        </td>
                        <td className="font-mono font-semibold text-slate-100 uppercase">
                          <Link
                            to={`/genes/${r.partner}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-brand-300"
                          >
                            {r.partner}
                          </Link>
                        </td>
                        <td>
                          <div className="font-semibold text-slate-100">{r.niche_lb}</div>
                          <div className="text-[10px] font-mono text-slate-500">{r.niche}</div>
                        </td>
                        <td className="font-mono text-xs text-slate-500">l{r.level}</td>
                        <td className="font-mono tabular-nums text-brand-300">
                          {r.enrichment.toFixed(2)}×
                        </td>
                        <td className="text-right text-brand-400 text-xs">→</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExtLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="px-2.5 py-1 rounded-md border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 hover:border-brand-500/50 transition"
    >
      {children} ↗
    </a>
  )
}
