import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Key, 
  Server, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Layers, 
  FileCode, 
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { d1Service, D1Config, D1TableSummary } from '../../services/d1';
import { useAuth } from '../../context/AuthContext';

export const CloudflareD1Manager: React.FC = () => {
  const { currentUser, isPrincipalPartner } = useAuth();

  const [config, setConfig] = useState<D1Config>(d1Service.getConfig());
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);

  // Operations state
  const [isDeployingSchema, setIsDeployingSchema] = useState(false);
  const [schemaResult, setSchemaResult] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT name, role, availability FROM users LIMIT 5;');
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<{ success: boolean; results?: any[]; meta?: any; error?: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Tables summary
  const [tables, setTables] = useState<D1TableSummary[]>(d1Service.getTableSummaries());

  useEffect(() => {
    setTables(d1Service.getTableSummaries());
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = d1Service.saveConfig(config);
    setConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await d1Service.testConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const handleDeploySchema = async () => {
    if (!window.confirm('Deploy initial tables and indexes to Cloudflare D1? This will execute CREATE TABLE statements.')) {
      return;
    }
    setIsDeployingSchema(true);
    setSchemaResult(null);
    const res = await d1Service.initSchema();
    setIsDeployingSchema(false);
    if (res.success) {
      setSchemaResult(`✓ Successfully applied ${res.appliedTables} tables and indexes to Cloudflare D1.`);
    } else {
      setSchemaResult(`✕ Schema deployment failed: ${res.error}`);
    }
  };

  const handleExportData = async () => {
    if (!window.confirm('Export all current Chambers data (Users, Retainers, Cases, Properties, Invoices, Consultations) to Cloudflare D1?')) {
      return;
    }
    setIsExporting(true);
    setExportResult(null);
    const res = await d1Service.exportAllToD1();
    setIsExporting(false);
    if (res.success) {
      setExportResult(`✓ Successfully synchronized ${res.recordsExported} firm records into Cloudflare D1.`);
      setConfig(d1Service.getConfig());
    } else {
      setExportResult(`✕ Export failed: ${res.error}`);
    }
  };

  const handleImportData = async () => {
    if (!window.confirm('Pull all records from Cloudflare D1 into local storage?')) {
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    const res = await d1Service.importAllFromD1();
    setIsImporting(false);
    if (res.success) {
      setImportResult(`✓ Restored data from Cloudflare D1 across ${res.tablesImported} database entities.`);
      setConfig(d1Service.getConfig());
      setTables(d1Service.getTableSummaries());
    } else {
      setImportResult(`✕ Import failed: ${res.error}`);
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setSqlResult(null);
    const res = await d1Service.query(sqlQuery.trim());
    setIsExecutingSql(false);
    setSqlResult(res);
  };

  const handleCopySchemaSql = () => {
    const sampleDdl = `-- Cloudflare D1 Initial Schema Example
-- Run using 'wrangler d1 execute <database_name> --file=./src/db/d1-schema.sql'
SELECT name, type FROM sqlite_master WHERE type='table';`;
    navigator.clipboard.writeText(sampleDdl);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const isConnected = testResult?.success;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              DATABASE INFRASTRUCTURE
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Cloudflare D1 Serverless SQL Integration
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <Database className="w-6 h-6 text-amber-600" />
            <span>Cloudflare D1 Relational Storage</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seamless serverless SQLite persistence for B. B. Bale & Co. Chambers dockets, personnel, litigation briefs, escrow ledgers, and public services.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            testResult?.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : config.accountId && config.databaseId
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              testResult?.success ? 'bg-emerald-600 animate-pulse' : config.accountId ? 'bg-amber-500' : 'bg-slate-400'
            }`}></span>
            <span>
              {testResult?.success ? 'D1 Connected' : config.accountId ? 'Configured (Untested)' : 'Local Storage Mode'}
            </span>
          </span>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg border border-slate-800 transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test D1 Connection'}</span>
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
            <p className="font-bold">{testResult.success ? 'Connection Validated' : 'Connection Error'}</p>
            <p className="mt-0.5 whitespace-pre-wrap">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Grid: Credentials & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cloudflare D1 Credentials & Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Cloudflare D1 Credentials</span>
              </h3>
              {saveSuccess && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ✓ Settings Saved
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cloudflare Account ID: *
              </label>
              <input
                type="text"
                value={config.accountId}
                onChange={e => setConfig({ ...config, accountId: e.target.value.trim() })}
                placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found on your Cloudflare dashboard overview page.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                D1 Database ID / UUID: *
              </label>
              <input
                type="text"
                value={config.databaseId}
                onChange={e => setConfig({ ...config, databaseId: e.target.value.trim() })}
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                UUID of your Cloudflare D1 database (create with <code>wrangler d1 create bbbale-db</code>).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cloudflare API Token: *
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.apiToken}
                  onChange={e => setConfig({ ...config, apiToken: e.target.value.trim() })}
                  placeholder="Bearer token with 'D1:Edit' permissions"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 pr-10 focus:outline-hidden focus:border-amber-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Token must have Cloudflare D1 Edit permissions on your account.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Custom Proxy / Cloudflare Worker Endpoint (Optional):
              </label>
              <input
                type="text"
                value={config.customEndpoint || ''}
                onChange={e => setConfig({ ...config, customEndpoint: e.target.value.trim() })}
                placeholder="Leave blank for automatic dev proxy or https://api.cloudflare.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={e => setConfig({ ...config, autoSync: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 text-xs">
                  Replicate Mutations Live to Cloudflare D1
                </span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors shadow-xs"
              >
                Save Configuration
              </button>
            </div>
          </form>

          {/* D1 Migration & Synchronization Tools */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-100 pb-3">
              <HardDrive className="w-4 h-4 text-amber-600" />
              <span>D1 Schema Deployment & Synchronization</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDeploySchema}
                disabled={isDeployingSchema}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors space-y-1"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Deploy Schema</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Execute initial D1 DDL statements for all 28 tables and indexes.
                </p>
              </button>

              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors space-y-1"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Push to D1</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export all current local records (Users, Matters, Invoices) into D1.
                </p>
              </button>

              <button
                onClick={handleImportData}
                disabled={isImporting}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors space-y-1"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                  <DownloadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Pull from D1</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Fetch latest tables from Cloudflare D1 into local application store.
                </p>
              </button>
            </div>

            {schemaResult && (
              <div className="p-3 bg-slate-900 text-amber-300 rounded-lg font-mono text-[11px]">
                {schemaResult}
              </div>
            )}

            {exportResult && (
              <div className="p-3 bg-slate-900 text-blue-300 rounded-lg font-mono text-[11px]">
                {exportResult}
              </div>
            )}

            {importResult && (
              <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px]">
                {importResult}
              </div>
            )}

            {config.lastSyncAt && (
              <p className="text-[11px] text-slate-400">
                Last synchronized with Cloudflare D1: <strong className="text-slate-600">{new Date(config.lastSyncAt).toLocaleString()}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Interactive SQL Console & Tables Inspector */}
        <div className="lg:col-span-6 space-y-6">
          {/* Interactive SQL Console */}
          <div className="bg-slate-950 text-white rounded-xl border border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Cloudflare D1 SQL Query Console</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSqlQuery('SELECT name, role, availability FROM users;')}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  Users
                </button>
                <button
                  onClick={() => setSqlQuery('SELECT suit_number, court_id, status FROM cases;')}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  Cases
                </button>
                <button
                  onClick={() => setSqlQuery('SELECT invoice_number, total_amount, payment_status FROM invoices;')}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  Invoices
                </button>
              </div>
            </div>

            <div>
              <textarea
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-900 text-amber-300 font-mono text-xs rounded-lg border border-slate-800 focus:outline-hidden focus:border-amber-500"
                placeholder="Enter SQL statement to execute on Cloudflare D1..."
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">
                Executes via Cloudflare D1 REST API query interface
              </span>
              <button
                onClick={handleExecuteSql}
                disabled={isExecutingSql}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isExecutingSql ? 'Running...' : 'Run SQL Query'}</span>
              </button>
            </div>

            {/* Query Results */}
            {sqlResult && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Status: <strong className={sqlResult.success ? 'text-emerald-400' : 'text-rose-400'}>{sqlResult.success ? 'Success' : 'Error'}</strong></span>
                  {sqlResult.results && <span>Rows returned: {sqlResult.results.length}</span>}
                </div>

                {sqlResult.error && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded border border-rose-800 font-mono">
                    {sqlResult.error}
                  </p>
                )}

                {sqlResult.results && sqlResult.results.length > 0 && (
                  <div className="overflow-x-auto max-h-56 rounded border border-slate-800">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-slate-900 text-slate-300 uppercase">
                        <tr>
                          {Object.keys(sqlResult.results[0]).map(col => (
                            <th key={col} className="p-2 border-b border-slate-800">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {sqlResult.results.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            {Object.values(row).map((val: any, cidx) => (
                              <td key={cidx} className="p-2 truncate max-w-xs">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* D1 Tables Directory & Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>D1 Database Tables Registry</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pre-configured SQLite schemas for Chambers operational modules.
                </p>
              </div>
              <button
                onClick={handleCopySchemaSql}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center space-x-1"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copied' : 'Schema CLI'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {tables.map(tbl => (
                <div key={tbl.tableName} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-[11px] text-slate-900 truncate">
                      {tbl.tableName}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      {tbl.recordCount}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{tbl.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
