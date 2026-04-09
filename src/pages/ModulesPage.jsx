import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getModules, getFeatureTable } from '../lib/data.js'
import { Loading, ErrorBox } from '../components/Loading.jsx'

export default function ModulesPage() {
  const { name } = useParams()
  const [modulesData, setModulesData] = useState(null)
  const [features, setFeatures] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setModulesData(null); setFeatures(null); setSelected(null); setError(null)
    Promise.all([getModules(name), getFeatureTable(name)])
      .then(([m, f]) => {
        setModulesData(m)
        setFeatures(f)
      })
      .catch(setError)
  }, [name])

  if (error) return <ErrorBox error={error} />
  if (!modulesData || !features) return <Loading what="modules" />

  const featureMap = Object.fromEntries(features.map((f) => [f.feature_idx, f]))
  const selectedModule = selected != null
    ? modulesData.modules.find((m) => m.module_id === selected)
    : null

  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/" className="hover:underline">Surfaces</Link> /{' '}
        <Link to={`/surface/${name}`} className="hover:underline font-mono">{name}</Link> /{' '}
        <span>modules</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        Modules · <span className="font-mono text-brand-700">{name}</span>
      </h1>
      <p className="text-sm text-slate-600 mb-6 max-w-3xl">
        Communities of co-active SAE features discovered via PMI &gt; 1 graph + Leiden community
        detection on the global activation matrix. Click a module to see its members.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            {modulesData.n_modules ?? modulesData.modules.length} modules
          </div>
          <div className="rounded-lg border border-slate-200 bg-white max-h-[70vh] overflow-y-auto">
            {modulesData.modules.map((m) => (
              <button
                key={m.module_id}
                onClick={() => setSelected(m.module_id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-brand-50 flex items-center justify-between text-sm ${
                  selected === m.module_id ? 'bg-brand-100' : ''
                }`}
              >
                <span className="font-mono">module #{m.module_id}</span>
                <span className="text-xs text-slate-500">{m.n_features} feats</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedModule ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Module #{selectedModule.module_id} · {selectedModule.n_features} features
                </h2>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <table className="atlas">
                  <thead>
                    <tr>
                      <th>idx</th>
                      <th>top genes / hit</th>
                      <th>tissue</th>
                      <th>mean |a|</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModule.members.map((idx) => {
                      const f = featureMap[idx]
                      if (!f) return null
                      return (
                        <tr key={idx}>
                          <td className="font-mono">
                            <Link to={`/surface/${name}/feature/${idx}`} className="text-brand-700 hover:underline">
                              {idx}
                            </Link>
                          </td>
                          <td className="text-xs">
                            {f.top_genes && (
                              <div className="font-mono">{f.top_genes}</div>
                            )}
                            {f.top_PanglaoDB_v2 && (
                              <div className="text-slate-500">{f.top_PanglaoDB_v2}</div>
                            )}
                          </td>
                          <td>
                            {f.top_tissue && <span className="pill-slate">{f.top_tissue}</span>}
                          </td>
                          <td className="font-mono tabular-nums">{f.mean_abs?.toFixed(4) ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
              Select a module on the left to see its members.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
