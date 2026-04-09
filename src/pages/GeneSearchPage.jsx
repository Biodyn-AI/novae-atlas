import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGeneIndex, getFeatureTable } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function GeneSearchPage() {
  const [index, setIndex] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedGene, setSelectedGene] = useState(null)
  const [labelLookup, setLabelLookup] = useState({})

  useEffect(() => {
    setError(null)
    Promise.all([getGeneIndex(), getFeatureTable('aggregator'), getFeatureTable('cell_embedder')])
      .then(([idx, agg, ce]) => {
        setIndex(idx)
        const lk = {}
        for (const f of agg) lk[`aggregator/${f.feature_idx}`] = f.lb
        for (const f of ce) lk[`cell_embedder/${f.feature_idx}`] = f.lb
        setLabelLookup(lk)
      })
      .catch(setError)
  }, [])

  const allGenes = useMemo(() => {
    if (!index) return []
    return Object.keys(index).sort()
  }, [index])

  const suggestions = useMemo(() => {
    if (!query || !index) return []
    const q = query.toUpperCase()
    return allGenes.filter((g) => g.includes(q)).slice(0, 12)
  }, [query, allGenes, index])

  const results = useMemo(() => {
    if (!selectedGene || !index) return null
    return index[selectedGene] ?? []
  }, [selectedGene, index])

  if (error) return <ErrorBox error={error} />
  if (!index) return <Loading what="gene index" />

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Gene search</h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          Search any of the <span className="text-brand-300">{allGenes.length.toLocaleString()}</span>{' '}
          unique genes that appear in the top-20 of at least one aggregator or cell_embedder SAE
          feature. Click a gene to see the SAE features that load most strongly on it.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedGene(null) }}
          placeholder="Type a gene name (e.g. AQP2, FOXP3, CTLA4, MS4A1, GATA2)…"
          className="input !text-lg !py-3 !px-5"
          autoFocus
        />
        {suggestions.length > 0 && !selectedGene && (
          <ul className="absolute z-30 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            {suggestions.map((g) => (
              <li key={g}>
                <button
                  onClick={() => { setSelectedGene(g); setQuery(g) }}
                  className="w-full text-left px-5 py-2 hover:bg-brand-500/10 font-mono text-sm text-slate-200"
                >
                  {g}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedGene && results && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-50 font-mono tracking-tight">{selectedGene}</h2>
            <p className="text-slate-400 text-sm mt-1">
              Top {results.length} features (across aggregator + cell_embedder), ranked by score
            </p>
          </div>

          {results.length === 0 ? (
            <div className="card text-center text-slate-500 py-8">
              No features load strongly on {selectedGene}.
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
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const lb = labelLookup[`${r.s}/${r.i}`]
                    return (
                      <tr key={i}>
                        <td>
                          <span className={r.s === 'aggregator' ? 'pill-blue' : 'pill-purple'}>
                            {r.s}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-slate-500">
                          <Link to={`/surface/${r.s}/feature/${r.i}`} className="hover:text-brand-300">
                            f{r.i}
                          </Link>
                        </td>
                        <td>
                          <Link
                            to={`/surface/${r.s}/feature/${r.i}`}
                            className="font-semibold text-slate-100 hover:text-brand-300"
                          >
                            {lb || 'Unannotated'}
                          </Link>
                        </td>
                        <td className="font-mono tabular-nums text-brand-300">
                          {r.metric === 'fc' ? `${r.score.toFixed(1)}×` : r.score.toFixed(3)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
