import { useState } from "react"
import axios from "axios"

const API = "https://appcompiler-production.up.railway.app"

const STAGE_LABELS = {
  intent_extraction: "Intent Extraction",
  system_design: "System Design",
  validation: "Validation + Repair",
  runtime_simulation: "Runtime Simulation"
}

const STAGE_ICONS = {
  intent_extraction: "⚡",
  system_design: "🏗",
  validation: "🛡",
  runtime_simulation: "🚀"
}

export default function App() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [tab, setTab] = useState("output")

  async function runCompiler() {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await axios.post(`${API}/compile`, { prompt })
      setResult(res.data)
      setTab("output")
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function loadMetrics() {
    const res = await axios.get(`${API}/metrics`)
    setMetrics(res.data)
    setTab("metrics")
    // Auto refresh every 5 seconds
    setTimeout(loadMetrics, 5000)
  }

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>⚙</div>
          <div>
            <div style={s.logoTitle}>Varshika's AppCompiler</div>
            <div style={s.logoSub}>v1.0 · AI Pipeline</div>
          </div>
        </div>

        <div style={s.sideSection}>PIPELINE</div>
        {Object.entries(STAGE_LABELS).map(([key, label]) => (
          <div key={key} style={s.sideItem}>
            <span style={s.sideIcon}>{STAGE_ICONS[key]}</span>
            <span>{label}</span>
            {result && (
              <span style={{
                marginLeft: "auto",
                fontSize: 10,
                color: result.pipeline.find(p => p.stage === key)?.status === "done" || result.pipeline.find(p => p.stage === key)?.status === "passed" ? "#4ade80" : "#f87171"
              }}>
                {result.pipeline.find(p => p.stage === key)?.status === "done" || result.pipeline.find(p => p.stage === key)?.status === "passed" ? "✓" : ""}
              </span>
            )}
          </div>
        ))}

        <div style={{...s.sideSection, marginTop: 24}}>OUTPUTS</div>
        {result && ["output","runtime","intent","metrics"].map(t => (
          <div key={t} onClick={() => t === "metrics" ? loadMetrics() : setTab(t)}
            style={{...s.sideItem, ...(tab === t ? s.sideItemActive : {})}}>
            <span style={s.sideIcon}>{t === "output" ? "📄" : t === "runtime" ? "🔬" : t === "intent" ? "🧠" : "📊"}</span>
            <span style={{textTransform:"capitalize"}}>{t}</span>
          </div>
        ))}
        {!result && (
          <div style={{padding:"8px 16px", fontSize:12, color:"#4b5563"}}>
            Run a prompt to see outputs
          </div>
        )}

        <div style={{marginTop:"auto", padding:"16px", borderTop:"1px solid #1f2937"}}>
          <div style={{fontSize:11, color:"#4b5563", marginBottom:8}}>MODEL</div>
          <div style={{fontSize:12, color:"#9ca3af"}}>openai/gpt-oss-120b</div>
          <div style={{fontSize:11, color:"#4b5563", marginTop:8}}>PROVIDER</div>
          <div style={{fontSize:12, color:"#9ca3af"}}>OpenRouter · Free tier</div>
        </div>
      </div>

      {/* Main content */}
      <div style={s.main}>

        {/* Top bar */}
        <div style={s.topbar}>
          <div>
            <div style={s.topTitle}>Natural Language → Executable App Config</div>
            <div style={s.topSub}>Multi-stage AI pipeline with validation, repair, and runtime simulation</div>
          </div>
          <button style={s.metricsBtn} onClick={loadMetrics}>📊 Metrics</button>
        </div>

        {/* Input area */}
        <div style={s.inputCard}>
          <div style={s.inputLabel}>Describe your application</div>
          <textarea
            style={s.textarea}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder='e.g. "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics."'
            rows={3}
            onKeyDown={e => e.key === "Enter" && e.metaKey && runCompiler()}
          />
          <div style={s.inputRow}>
            <span style={s.hint}>⌘ + Enter to compile</span>
            <button
              style={{...s.compileBtn, ...(loading ? s.compileBtnLoading : {})}}
              onClick={runCompiler}
              disabled={loading}
            >
              {loading ? (
                <span>⚙ Compiling pipeline<LoadingDots /></span>
              ) : "▶  Compile App"}
            </button>
          </div>
        </div>

        {/* Pipeline progress */}
        {(result || loading) && (
          <div style={s.pipelineRow}>
            {Object.entries(STAGE_LABELS).map(([key, label], i) => {
              const stage = result?.pipeline.find(p => p.stage === key)
              const status = stage?.status || (loading ? "waiting" : "")
              return (
                <div key={key} style={s.pipelineStage}>
                  <div style={{...s.stageDot,
                    background: status === "done" || status === "passed" ? "#4ade80"
                      : status === "repairing" ? "#fb923c"
                      : status === "failed" ? "#f87171"
                      : status === "running" ? "#facc15"
                      : "#1f2937",
                    boxShadow: status === "running" ? "0 0 8px #facc15" : status === "done" || status === "passed" ? "0 0 8px #4ade80" : "none"
                  }}/>
                  <div style={s.stageLabel}>{label}</div>
                  <div style={{fontSize:10, color: status === "passed" || status === "done" ? "#4ade80" : "#6b7280", marginTop:2}}>
                    {status || "waiting"}
                  </div>
                  {i < 3 && <div style={s.stageConnector}/>}
                </div>
              )
            })}
          </div>
        )}

        {/* Meta badges */}
        {result && (
          <div style={s.metaRow}>
            <span style={s.metaBadge}>⏱ {result.meta.latency_ms}ms</span>
            <span style={s.metaBadge}>🔁 {result.meta.retries} retries</span>
            <span style={s.metaBadge}>🔧 {result.meta.repair_count} repairs</span>
            <span style={{...s.metaBadge, background:"#052e16", color:"#4ade80", border:"1px solid #166534"}}>✓ Pipeline complete</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={s.errorCard}>
            <div style={{fontWeight:600, color:"#f87171", marginBottom:8}}>Pipeline failed</div>
            <pre style={{fontSize:12, color:"#fca5a5", margin:0, overflowX:"auto"}}>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        {/* Tab content */}
        {result && tab === "output" && <OutputTab result={result} />}
        {result && tab === "runtime" && <RuntimeTab result={result} />}
        {result && tab === "intent" && <IntentTab result={result} />}
        {metrics && tab === "metrics" && <MetricsTab metrics={metrics} />}

        {!result && !loading && !error && (
          <div style={s.emptyState}>
            <div style={{fontSize:48, marginBottom:16}}>⚙</div>
            <div style={{fontSize:18, fontWeight:600, color:"#e5e7eb", marginBottom:8}}>Ready to compile</div>
            <div style={{fontSize:14, color:"#6b7280", maxWidth:400, textAlign:"center", lineHeight:1.6}}>
              Describe any app above. The pipeline will extract intent, design the system, generate schemas, validate consistency, and simulate execution.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingDots() {
  return <span style={{letterSpacing:2}}>...</span>
}

function OutputTab({ result }) {
  return (
    <div style={s.grid2}>
      <DarkSection title="UI Pages" icon="🖥" color="#818cf8">
        {result.config.ui.map((p, i) => (
          <div key={i} style={s.darkItem}>
            <div style={s.itemHeader}>
              <strong style={{color:"#e5e7eb"}}>{p.name}</strong>
              <code style={s.darkCode}>{p.route}</code>
            </div>
            <div style={s.tagRow}>
              {p.components.map(c => <span key={c} style={s.tagPurple}>{c}</span>)}
            </div>
            <div style={s.tagRow}>
              {p.allowed_roles.map(r => <span key={r} style={s.tagAmber}>👤 {r}</span>)}
            </div>
          </div>
        ))}
      </DarkSection>

      <DarkSection title="API Endpoints" icon="⚡" color="#38bdf8">
        {result.config.api.map((e, i) => (
          <div key={i} style={s.darkItem}>
            <div style={s.itemHeader}>
              <span style={{
                ...s.methodBadge,
                background: e.method === "GET" ? "#052e16" : e.method === "POST" ? "#172554" : "#450a0a",
                color: e.method === "GET" ? "#4ade80" : e.method === "POST" ? "#60a5fa" : "#f87171",
                border: `1px solid ${e.method === "GET" ? "#166534" : e.method === "POST" ? "#1e40af" : "#991b1b"}`
              }}>{e.method}</span>
              <code style={s.darkCode}>{e.path}</code>
            </div>
            <div style={{fontSize:11, color:"#6b7280", marginTop:4}}>{e.description}</div>
          </div>
        ))}
      </DarkSection>

      <DarkSection title="Database Schema" icon="🗄" color="#34d399">
        {result.config.db.map((t, i) => (
          <div key={i} style={s.darkItem}>
            <strong style={{color:"#e5e7eb"}}>{t.name}</strong>
            <div style={s.tagRow}>
              {t.fields.map(f => <span key={f} style={s.tagGreen}>{f}</span>)}
            </div>
            {t.relations.length > 0 && (
              <div style={{fontSize:11, color:"#6b7280", marginTop:4}}>🔗 {t.relations.join(", ")}</div>
            )}
          </div>
        ))}
      </DarkSection>

      <DarkSection title="Auth Rules" icon="🛡" color="#fb923c">
        {result.config.auth.map((a, i) => (
          <div key={i} style={s.darkItem}>
            <strong style={{color:"#e5e7eb"}}>Role: {a.role}</strong>
            <div style={s.tagRow}>
              {a.permissions.map(p => <span key={p} style={s.tagOrange}>{p}</span>)}
            </div>
          </div>
        ))}
      </DarkSection>
    </div>
  )
}

function DarkSection({ title, icon, color, children }) {
  return (
    <div style={{...s.darkSection, borderTop:`2px solid ${color}`}}>
      <div style={{...s.darkSectionTitle, color}}>{icon} {title}</div>
      {children}
    </div>
  )
}

function RuntimeTab({ result }) {
  return (
    <div style={s.darkSection}>
      <div style={s.darkSectionTitle}>🔬 Runtime Simulation Report</div>
      <RuntimeBlock title="Routes Validated" items={result.runtime.routes_validated} ok/>
      <RuntimeBlock title="Routes Failed" items={result.runtime.routes_failed} ok={false}/>
      <RuntimeBlock title="DB Relations" items={result.runtime.db_relations_valid} ok/>
      <RuntimeBlock title="DB Relations Failed" items={result.runtime.db_relations_failed} ok={false}/>
      <RuntimeBlock title="Auth Flows" items={result.runtime.auth_flows_valid} ok/>
      <RuntimeBlock title="Auth Flows Failed" items={result.runtime.auth_flows_failed} ok={false}/>
      <div style={{marginTop:16, padding:"12px 16px", background: result.runtime.overall_pass ? "#052e16" : "#450a0a", borderRadius:8, border:`1px solid ${result.runtime.overall_pass ? "#166534" : "#991b1b"}`}}>
        <span style={{color: result.runtime.overall_pass ? "#4ade80" : "#f87171", fontWeight:600}}>
          {result.runtime.overall_pass ? "✓ All runtime checks passed" : "✗ Some runtime checks failed"}
        </span>
      </div>
    </div>
  )
}

function RuntimeBlock({ title, items, ok }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontWeight:600, color: ok ? "#4ade80" : "#f87171", fontSize:12, marginBottom:6}}>
        {ok ? "✓" : "✗"} {title} ({items.length})
      </div>
      {items.map((item, i) => (
        <div key={i} style={{fontSize:12, color:"#9ca3af", padding:"4px 0", borderBottom:"1px solid #1f2937"}}>{item}</div>
      ))}
    </div>
  )
}

function IntentTab({ result }) {
  return (
    <div style={s.darkSection}>
      <div style={s.darkSectionTitle}>🧠 Extracted Intent</div>
      <pre style={{fontSize:13, color:"#a5f3fc", margin:0, lineHeight:1.8}}>{JSON.stringify(result.intent, null, 2)}</pre>
    </div>
  )
}

function MetricsTab({ metrics }) {
  return (
    <div>
      <div style={s.metricsGrid}>
        <MetricBox label="Total Runs" value={metrics.total_runs}/>
        <MetricBox label="Success Rate" value={metrics.success_rate + "%"} good={metrics.success_rate > 70}/>
        <MetricBox label="Avg Latency" value={metrics.avg_latency_ms + "ms"}/>
        <MetricBox label="Avg Retries" value={metrics.avg_retries}/>
        <MetricBox label="Avg Repairs" value={metrics.avg_repair_count}/>
      </div>
      {metrics.recent_runs.length > 0 && (
        <div style={{...s.darkSection, marginTop:16}}>
          <div style={s.darkSectionTitle}>📋 Recent Runs</div>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
            <thead>
              <tr>{["Prompt","Status","Retries","Repairs","Latency"].map(h => (
                <th key={h} style={{textAlign:"left", padding:"8px 12px", color:"#6b7280", borderBottom:"1px solid #1f2937", fontWeight:600}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {metrics.recent_runs.map((r, i) => (
                <tr key={i} style={{borderBottom:"1px solid #111827"}}>
                  <td style={{padding:"8px 12px", color:"#9ca3af", maxWidth:300}}>{r.prompt}</td>
                  <td style={{padding:"8px 12px", color: r.success ? "#4ade80" : "#f87171", fontWeight:600}}>{r.success ? "✓ Pass" : "✗ Fail"}</td>
                  <td style={{padding:"8px 12px", color:"#9ca3af"}}>{r.retries}</td>
                  <td style={{padding:"8px 12px", color:"#9ca3af"}}>{r.repair_count}</td>
                  <td style={{padding:"8px 12px", color:"#9ca3af"}}>{r.latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value, good }) {
  return (
    <div style={s.metricBox}>
      <div style={{fontSize:28, fontWeight:800, color: good !== undefined ? (good ? "#4ade80" : "#f87171") : "#e5e7eb"}}>{value}</div>
      <div style={{fontSize:11, color:"#6b7280", marginTop:4, textTransform:"uppercase", letterSpacing:".05em"}}>{label}</div>
    </div>
  )
}

const s = {
  page: { display:"flex", minHeight:"100vh", background:"#030712", color:"#e5e7eb", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  sidebar: { width:220, background:"#0a0f1a", borderRight:"1px solid #1f2937", display:"flex", flexDirection:"column", padding:"20px 0", flexShrink:0 },
  logo: { display:"flex", alignItems:"center", gap:10, padding:"0 16px 20px", borderBottom:"1px solid #1f2937", marginBottom:16 },
  logoIcon: { fontSize:24, background:"#6d28d9", width:36, height:36, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" },
  logoTitle: { fontSize:14, fontWeight:700, color:"#e5e7eb" },
  logoSub: { fontSize:10, color:"#4b5563" },
  sideSection: { fontSize:10, fontWeight:700, letterSpacing:".1em", color:"#4b5563", padding:"0 16px 8px", textTransform:"uppercase" },
  sideItem: { display:"flex", alignItems:"center", gap:8, padding:"7px 16px", fontSize:12, color:"#9ca3af", cursor:"pointer", transition:"all .15s" },
  sideItemActive: { background:"#1f2937", color:"#e5e7eb" },
  sideIcon: { fontSize:14, width:18, textAlign:"center" },
  main: { flex:1, padding:"24px 32px", overflowY:"auto" },
  topbar: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 },
  topTitle: { fontSize:20, fontWeight:700, color:"#e5e7eb", marginBottom:4 },
  topSub: { fontSize:13, color:"#6b7280" },
  metricsBtn: { background:"transparent", border:"1px solid #1f2937", color:"#9ca3af", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13 },
  inputCard: { background:"#0a0f1a", border:"1px solid #1f2937", borderRadius:12, padding:20, marginBottom:20 },
  inputLabel: { fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" },
  textarea: { width:"100%", background:"#030712", border:"1px solid #1f2937", borderRadius:8, padding:12, fontSize:14, color:"#e5e7eb", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box", outline:"none", lineHeight:1.6 },
  inputRow: { display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 },
  hint: { fontSize:11, color:"#374151" },
  compileBtn: { background:"#6d28d9", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:14, fontWeight:600, cursor:"pointer" },
  compileBtnLoading: { background:"#4c1d95" },
  pipelineRow: { display:"flex", alignItems:"flex-start", gap:0, marginBottom:16, background:"#0a0f1a", border:"1px solid #1f2937", borderRadius:12, padding:20, position:"relative" },
  pipelineStage: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" },
  stageDot: { width:12, height:12, borderRadius:"50%", marginBottom:8, transition:"all .3s" },
  stageLabel: { fontSize:11, fontWeight:600, color:"#9ca3af", textAlign:"center" },
  stageConnector: { position:"absolute", top:5, left:"50%", width:"100%", height:2, background:"#1f2937", zIndex:0 },
  metaRow: { display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" },
  metaBadge: { fontSize:12, background:"#0a0f1a", border:"1px solid #1f2937", color:"#9ca3af", padding:"4px 12px", borderRadius:20 },
  errorCard: { background:"#450a0a", border:"1px solid #991b1b", borderRadius:12, padding:20, marginBottom:20 },
  emptyState: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, color:"#6b7280" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  darkSection: { background:"#0a0f1a", border:"1px solid #1f2937", borderRadius:12, padding:20, marginBottom:16 },
  darkSectionTitle: { fontSize:12, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase", marginBottom:16, color:"#9ca3af" },
  darkItem: { marginBottom:14, paddingBottom:14, borderBottom:"1px solid #111827" },
  itemHeader: { display:"flex", alignItems:"center", gap:8, marginBottom:6 },
  darkCode: { fontSize:11, background:"#030712", color:"#a5f3fc", padding:"2px 8px", borderRadius:4, fontFamily:"monospace" },
  tagRow: { display:"flex", flexWrap:"wrap", gap:4, marginTop:6 },
  tagPurple: { fontSize:10, background:"#2e1065", color:"#a78bfa", padding:"2px 8px", borderRadius:10, border:"1px solid #4c1d95" },
  tagAmber: { fontSize:10, background:"#1c1002", color:"#fbbf24", padding:"2px 8px", borderRadius:10, border:"1px solid #78350f" },
  tagGreen: { fontSize:10, background:"#052e16", color:"#4ade80", padding:"2px 8px", borderRadius:10, border:"1px solid #166534", fontFamily:"monospace" },
  tagOrange: { fontSize:10, background:"#1c0a00", color:"#fb923c", padding:"2px 8px", borderRadius:10, border:"1px solid #7c2d12", fontFamily:"monospace" },
  methodBadge: { fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4 },
  metricsGrid: { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 },
  metricBox: { background:"#0a0f1a", border:"1px solid #1f2937", borderRadius:10, padding:"16px", textAlign:"center" },
}