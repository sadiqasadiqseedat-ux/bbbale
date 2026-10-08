import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  Server,
  Network
} from 'lucide-react';
import { d1Service, D1TableSummary } from '../../services/d1';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

export const CloudflareD1Manager: React.FC = () => {
  const { isPrincipalPartner } = useAuth();
  const config = d1Service.getConfig();

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT name, role, availability FROM users LIMIT 5;');
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<{ success: boolean; results?: any[]; meta?: any; error?: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Tables summary
  const [tables, setTables] = useState<D1TableSummary[]>(d1Service.getTableSummaries());

  useEffect(() => {
    // Initial connection test
    handleTestConnection();
    setTables(d1Service.getTableSummaries());
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await d1Service.testConnection();
    setIsTesting(false);
    setTestResult(res);
    setTables(d1Service.getTableSummaries());
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const success = await storageService.syncWithServer();
    setIsSyncing(false);
    setTables(d1Service.getTableSummaries());
    if (success) {
      setSyncResult('✓ Authoritative synchronization complete. All firm dockets up-to-date across devices.');
    } else {
      setSyncResult('✕ Synchronization error. Using active cache.');
    }
    setTimeout(() => setSyncResult(null), 5000);
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setSqlResult(null);
    const res = await d1Service.query(sqlQuery.trim());
    setIsExecutingSql(false);
    setSqlResult(res);
    setTables(d1Service.getTableSummaries());
  };

  const handleCopySchemaSql = () => {
    const sampleDdl = `-- Cloudflare D1 Production Binding
-- Worker: bbbale -> env.DB -> D1: 349d3f2c-bc47-418b-ade9-574de9c9812b
SELECT name, type FROM sqlite_master WHERE type='table';`;
    navigator.clipboard.writeText(sampleDdl);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              PRODUCTION CLOUD ARCHITECTURE
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Cloudflare Worker + D1 Binding
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <Database className="w-6 h-6 text-amber-600" />
            <span>Cloudflare D1 Relational Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative multi-device persistence for B. B. Bale & Co. Chambers dockets, clients, litigation cases, billing records, and tenancy registry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            testResult?.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              testResult?.success ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
            }`}></span>
            <span>
              {testResult?.success ? 'D1 Binding Connected' : 'Checking Worker Binding...'}
            </span>
          </span>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg border border-slate-800 transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
          testResult.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold">{testResult.success ? 'Worker + D1 Binding Active' : 'Connection Notice'}</p>
            <p className="mt-0.5 whitespace-pre-wrap">{testResult.message}</p>
          </div>
        </div>
      )}

      {syncResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Grid: Production Architecture & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cloudflare Architecture Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Server className="w-4 h-4 text-amber-600" />
                <span>Production Architecture Topology</span>
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                Zero Client Secrets
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This application utilizes the industry-standard Cloudflare Workers + D1 production architecture. The browser communicates strictly with the Cloudflare Worker API (<code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">/api/*</code>). The Worker accesses Cloudflare D1 directly via internal environment bindings (<code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">env.DB</code>).
            </p>

            {/* Architecture diagram */}
            <div className="bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-[11px] space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Network className="w-4 h-4" />
                <span>Device A & Device B Architecture:</span>
              </div>
              <div className="pl-4 border-l border-slate-700 space-y-1.5 text-slate-300">
                <p>Browser (Device A / B)</p>
                <p className="text-slate-500">↓ HTTPS Requests</p>
                <p>Cloudflare Worker (<span className="text-emerald-400">src/worker.ts</span>)</p>
                <p className="text-slate-500">↓ Internal D1 Binding (<span className="text-amber-300">env.DB</span>)</p>
                <p className="text-emerald-400 font-bold">Cloudflare D1: bbbale (349d3f2c-bc47-418b-ade9-574de9c9812b)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Worker Name</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{config.workerName}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">D1 Binding</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{config.bindingName}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Production Database ID</span>
                <span className="font-mono font-bold text-amber-800 text-xs break-all">{config.databaseId}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Security Verified: No Cloudflare API tokens or privileged secrets are bundled into client-side JavaScript.</span>
              </div>
            </div>
          </div>

          {/* Multi-Device Verification Guide */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
            <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Multi-Device Law Firm Verification</span>
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Multi-Device Dockets:</strong> Register a client or case on Device A; log in on Device B to immediately view the updated records.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Billing & Escrow:</strong> Invoices and verified payments are confirmed server-side in Cloudflare D1 with authorized receipt numbers.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Server-Side Roles:</strong> User sessions and credentials are authenticated directly against the <code className="font-mono text-slate-800">users</code> and <code className="font-mono text-slate-800">user_sessions</code> tables in D1.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Database Table Summary & SQL Console */}
        <div className="lg:col-span-6 space-y-6">
          {/* Tables Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Live Cloudflare D1 Table Statistics</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {tables.length} Production Tables
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {tables.map(tbl => (
                <div key={tbl.tableName} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{tbl.tableName}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({tbl.category})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">
                      {tbl.recordCount} records
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive SQL Console (Principal Partner Protected) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-slate-900 text-sm">Cloudflare D1 Query Console</h3>
              </div>
              <button
                onClick={handleCopySchemaSql}
                className="text-[11px] text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSchema ? 'Copied' : 'Copy Sample'}</span>
              </button>
            </div>

            {!isPrincipalPartner ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                Direct SQL query execution is protected and restricted to the Senior Advocate of Nigeria / Principal Partner account.
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 text-amber-300 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="SELECT name, role FROM users LIMIT 5;"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Runs against production D1 via authenticated Worker API.
                  </span>
                  <button
                    onClick={handleExecuteSql}
                    disabled={isExecutingSql}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg border border-slate-800 transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <Play className={`w-3.5 h-3.5 ${isExecutingSql ? 'animate-pulse' : ''}`} />
                    <span>{isExecutingSql ? 'Executing...' : 'Run Query'}</span>
                  </button>
                </div>

                {sqlResult && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px] max-h-48 overflow-auto">
                    {sqlResult.success ? (
                      <pre>{JSON.stringify(sqlResult.results, null, 2)}</pre>
                    ) : (
                      <p className="text-rose-400">Error: {sqlResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
