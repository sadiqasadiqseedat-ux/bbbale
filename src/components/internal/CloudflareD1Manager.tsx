import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  HardDrive,
  Info,
  Server
} from 'lucide-react';
import { d1Service, D1StatusResponse, D1TableSummary } from '../../services/d1';
import { syncWithServer } from '../../services/storage';

export const CloudflareD1Manager: React.FC = () => {
  const [status, setStatus] = useState<D1StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Operations state
  const [isDeployingSchema, setIsDeployingSchema] = useState(false);
  const [schemaResult, setSchemaResult] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT name, role, availability FROM users;');
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<{ success: boolean; results?: any[]; meta?: any; error?: string } | null>(null);
  const [copiedWrangler, setCopiedWrangler] = useState(false);

  // Tables summary
  const [tables, setTables] = useState<D1TableSummary[]>([]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    const res = await d1Service.getStatus();
    setStatus(res);
    setTables(d1Service.getTableSummaries());
    setLoadingStatus(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTestResult(null);
    const res = await d1Service.testConnection();
    setTestResult(res);
    fetchStatus();
  };

  const handleDeploySchema = async () => {
    setIsDeployingSchema(true);
    setSchemaResult(null);
    const res = await d1Service.initSchema();
    setIsDeployingSchema(false);
    if (res.success) {
      setSchemaResult(`✓ ${res.message}`);
      fetchStatus();
    } else {
      setSchemaResult(`✕ Schema check failed: ${res.error}`);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const success = await syncWithServer();
    setIsSyncing(false);
    if (success) {
      setSyncResult('✓ All firm collections synchronized with Cloudflare D1 across devices.');
      fetchStatus();
    } else {
      setSyncResult('✕ Synchronization request failed. Please check network connectivity.');
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setSqlResult(null);
    const res = await d1Service.executeSql(sqlQuery.trim());
    setIsExecutingSql(false);
    setSqlResult(res);
  };

  const handleCopyWrangler = () => {
    const wranglerSnippet = `# wrangler.toml D1 Binding
[[d1_databases]]
binding = "DB"
database_name = "bbbale"
database_id = "60c1e783-fa57-48b3-9b37-8d0041a4e80a"
migrations_dir = "migrations"`;
    navigator.clipboard.writeText(wranglerSnippet);
    setCopiedWrangler(true);
    setTimeout(() => setCopiedWrangler(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              Cloudflare Relational Architecture
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>D1 Binding: env.DB</span>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            Cloudflare D1 Central Database
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative, cross-device relational data persistence with zero frontend tokens and server-side role validation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
          </button>
          <button
            onClick={handleDeploySchema}
            disabled={isDeployingSchema}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{isDeployingSchema ? 'Verifying...' : 'Verify / Seed Schema'}</span>
          </button>
        </div>
      </div>

      {/* Connection & Security Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Connection</span>
            <Database className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-base font-bold text-slate-900">
                {status?.connected ? 'Cloudflare D1 Connected' : 'Checking Connection...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Binding: <code className="font-mono bg-slate-100 text-amber-800 px-1 py-0.5 rounded text-[11px]">env.DB</code>
            </p>
          </div>
          <button
            onClick={handleTestConnection}
            className="w-full text-center py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            Run Ping Diagnostic
          </button>
          {testResult && (
            <div className={`text-xs p-2 rounded ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zero-Token Security</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900">Frontend Protected</span>
            <p className="text-xs text-slate-500 mt-1">
              Cloudflare API tokens are <span className="font-semibold text-emerald-700">never exposed</span> in browser code or Vite environment variables.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] text-slate-600 font-mono">
            Architecture: Frontend → /api/* → Worker env.DB → D1
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cross-Device Synchrony</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900">
              {status?.totalTables ? `${status.totalTables} Active Tables` : '27 Relational Tables'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              All authorized devices read and write to the same single production database in real time.
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Auto-Sync Loop: Active (Every 8 seconds & on tab focus)
          </div>
        </div>
      </div>

      {schemaResult && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>{schemaResult}</span>
        </div>
      )}

      {syncResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Cloudflare Production Deployment Instructions */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Cloudflare Production Deployment Guide</h2>
          </div>
          <button
            onClick={handleCopyWrangler}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
          >
            {copiedWrangler ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedWrangler ? 'Copied Wrangler Config' : 'Copy wrangler.toml'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 space-y-2">
            <div className="font-bold text-amber-300 flex items-center space-x-1.5">
              <span>Step 1: Create D1 Database in Cloudflare</span>
            </div>
            <p className="text-slate-400">
              1. Open the <strong>Cloudflare Dashboard</strong> → <strong>Workers & Pages</strong> → <strong>D1 SQL Database</strong>.<br />
              2. Click <strong>Create Database</strong>.<br />
              3. Set database name to: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">bbbale</code>.<br />
              4. Copy the generated <strong>Database ID</strong> (<code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">60c1e783-fa57-48b3-9b37-8d0041a4e80a</code>).
            </p>
          </div>

          <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 space-y-2">
            <div className="font-bold text-amber-300 flex items-center space-x-1.5">
              <span>Step 2: Bind D1 to Cloudflare Pages / Worker</span>
            </div>
            <p className="text-slate-400">
              1. In Cloudflare Pages project settings: <strong>Settings</strong> → <strong>Functions</strong> → <strong>D1 Database Bindings</strong>.<br />
              2. Variable Name: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">DB</code>.<br />
              3. Select your D1 database: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">bbbale</code>.<br />
              4. Re-deploy. Cloudflare automatically injects <code className="text-amber-300">env.DB</code> into <code className="text-amber-300">functions/api/[[route]].ts</code>!
            </p>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200/90 flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero Secrets Rule:</strong> You never need to paste your Cloudflare API token into the frontend! The server-side Cloudflare Worker / Pages Function communicates with D1 directly via the internal <code className="font-mono text-amber-300">env.DB</code> runtime binding.
          </span>
        </div>
      </div>

      {/* Table Summaries */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cloudflare D1 Table Registry</h3>
            <p className="text-xs text-slate-500">Live record counts queried directly from Cloudflare D1</p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-50 rounded text-slate-700 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span>Refresh Counts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {tables.map(table => (
            <div key={table.tableName} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800 font-mono">{table.tableName}</p>
                <p className="text-[11px] text-slate-500">{table.category}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-700 font-mono">
                  {table.recordCount.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400">rows</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe SQL Diagnostics Console */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Cloudflare D1 SQL Inspection Console</h3>
          </div>
          <span className="text-xs text-slate-500">Read-only server query tool</span>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM clients LIMIT 5;"
              className="flex-1 font-mono text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50"
            />
            <button
              onClick={handleExecuteSql}
              disabled={isExecutingSql}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecutingSql ? 'Running...' : 'Execute'}</span>
            </button>
          </div>

          {sqlResult && (
            <div className="mt-3">
              {sqlResult.error ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-mono">
                  {sqlResult.error}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64 bg-slate-900 text-slate-200 p-3 font-mono text-xs">
                  <pre>{JSON.stringify(sqlResult.results, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
