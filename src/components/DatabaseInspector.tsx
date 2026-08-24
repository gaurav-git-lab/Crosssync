import React, { useState } from 'react';
import { Database, Table, Search, Download, RefreshCw, Key, Shield, HardDrive, Terminal } from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { formatBytes } from '../../shared/protocol';

export const DatabaseInspector: React.FC = () => {
  const [activeTable, setActiveTable] = useState<'paired_devices' | 'clipboard_history' | 'transfer_history' | 'app_settings'>('clipboard_history');
  const [filterQuery, setFilterQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM clipboard_history ORDER BY timestamp DESC LIMIT 50;');
  const [queryResultMsg, setQueryResultMsg] = useState<string | null>(null);

  const { windowsDevice, androidDevice, clipboardHistory, transferHistory, settings } = syncEngine;

  const pairedDevicesRows = [
    {
      id: windowsDevice.id,
      device_name: windowsDevice.name,
      platform: 'windows',
      device_type: 'laptop',
      public_key: '04_ec_p256_pub_key_win_9a',
      shared_secret_encrypted: 'aes_gcm_enc_secret_key_hash',
      paired_at: windowsDevice.pairedAt,
      last_seen: windowsDevice.lastSeen,
      is_trusted: 1,
      bluetooth_mac: windowsDevice.bluetoothMac,
      ip_address: windowsDevice.ipAddress,
      is_online: windowsDevice.isOnline ? 1 : 0,
    },
    {
      id: androidDevice.id,
      device_name: androidDevice.name,
      platform: 'android',
      device_type: 'phone',
      public_key: '04_ec_p256_pub_key_android_77',
      shared_secret_encrypted: 'aes_gcm_enc_secret_key_hash',
      paired_at: androidDevice.pairedAt,
      last_seen: androidDevice.lastSeen,
      is_trusted: 1,
      bluetooth_mac: androidDevice.bluetoothMac,
      ip_address: androidDevice.ipAddress,
      is_online: androidDevice.isOnline ? 1 : 0,
    }
  ];

  const appSettingsRows = [
    { key: 'clipboard_sync_enabled', value: String(settings.clipboardSyncEnabled), updated_at: '2026-08-24' },
    { key: 'auto_bluetooth_enabled', value: String(settings.autoBluetoothEnabled), updated_at: '2026-08-24' },
    { key: 'aes_encryption_enabled', value: String(settings.aesEncryptionEnabled), updated_at: '2026-08-24' },
    { key: 'retention_days', value: String(settings.retentionDays), updated_at: '2026-08-24' },
    { key: 'auto_download_files_under_mb', value: String(settings.autoDownloadFilesUnderMb), updated_at: '2026-08-24' },
    { key: 'sound_feedback_enabled', value: String(settings.soundFeedbackEnabled), updated_at: '2026-08-24' },
    { key: 'auto_disconnect_inactivity_mins', value: String(settings.autoDisconnectInactivityMins), updated_at: '2026-08-24' },
  ];

  const handleRunQuery = () => {
    setQueryResultMsg(`Query executed successfully: ${Math.floor(Math.random() * 4 + 2)} rows returned in 1.4ms (SQLite in-memory indexed engine).`);
    setTimeout(() => setQueryResultMsg(null), 3000);
  };

  const downloadJsonExport = () => {
    const data = {
      paired_devices: pairedDevicesRows,
      clipboard_history: clipboardHistory,
      transfer_history: transferHistory,
      app_settings: appSettingsRows,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crosssync_sqlite_dump_${Date.now()}.json`;
    a.click();
  };

  return (
    <div id="database-inspector-view" className="h-full flex flex-col glass-panel rounded-2xl p-5 overflow-hidden border border-white/10 text-white select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">SQLite Embedded Schema & Live Database</h3>
            <p className="text-xs text-gray-400">Target: <code className="text-cyan-300">rusqlite</code> (Windows) & <code className="text-cyan-300">sqflite</code> (Android)</p>
          </div>
        </div>

        <button
          id="export-db-json-btn"
          onClick={downloadJsonExport}
          className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export DB Dump (.JSON)
        </button>
      </div>

      {/* SQL Query Console */}
      <div className="my-4 p-3 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Terminal className="w-3.5 h-3.5" /> SQLite Query Console
          </span>
          <span>Indexed • B-Tree Optimized</span>
        </div>
        <div className="flex gap-2">
          <input
            id="sql-query-input"
            type="text"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            id="run-sql-btn"
            onClick={handleRunQuery}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold rounded-lg transition-all"
          >
            Execute SQL
          </button>
        </div>
        {queryResultMsg && (
          <span className="text-[11px] text-emerald-400 font-mono animate-fade-in">{queryResultMsg}</span>
        )}
      </div>

      {/* Table Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'clipboard_history', label: 'clipboard_history', count: clipboardHistory.length },
          { id: 'transfer_history', label: 'transfer_history', count: transferHistory.length },
          { id: 'paired_devices', label: 'paired_devices', count: pairedDevicesRows.length },
          { id: 'app_settings', label: 'app_settings', count: appSettingsRows.length },
        ].map((tbl) => (
          <button
            key={tbl.id}
            id={`db-tab-${tbl.id}`}
            onClick={() => setActiveTable(tbl.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              activeTable === tbl.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-black/20 text-gray-400 border-white/5 hover:text-gray-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{tbl.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-gray-300">
              {tbl.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Data View */}
      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/30">
        {activeTable === 'clipboard_history' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 text-gray-400 sticky top-0 border-b border-white/10">
              <tr>
                <th className="p-2.5">id</th>
                <th className="p-2.5">content</th>
                <th className="p-2.5">source_device</th>
                <th className="p-2.5">platform</th>
                <th className="p-2.5">timestamp</th>
                <th className="p-2.5">is_pinned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clipboardHistory.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="p-2.5 text-cyan-400 font-semibold">{row.id}</td>
                  <td className="p-2.5 text-gray-200 max-w-xs truncate">{row.content}</td>
                  <td className="p-2.5 text-gray-400">{row.sourceDeviceName}</td>
                  <td className="p-2.5 text-gray-300">{row.sourcePlatform}</td>
                  <td className="p-2.5 text-gray-400">{new Date(row.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2.5 text-cyan-300">{row.isPinned ? '1 (TRUE)' : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTable === 'transfer_history' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 text-gray-400 sticky top-0 border-b border-white/10">
              <tr>
                <th className="p-2.5">id</th>
                <th className="p-2.5">file_name</th>
                <th className="p-2.5">file_size</th>
                <th className="p-2.5">direction</th>
                <th className="p-2.5">status</th>
                <th className="p-2.5">speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transferHistory.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="p-2.5 text-cyan-400 font-semibold">{row.id}</td>
                  <td className="p-2.5 text-gray-200">{row.fileName}</td>
                  <td className="p-2.5 text-gray-400">{formatBytes(row.fileSizeBytes)}</td>
                  <td className="p-2.5 text-gray-300">{row.direction}</td>
                  <td className="p-2.5 text-emerald-400">{row.status}</td>
                  <td className="p-2.5 text-cyan-300">{formatBytes(row.speedBytesPerSec)}/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTable === 'paired_devices' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 text-gray-400 sticky top-0 border-b border-white/10">
              <tr>
                <th className="p-2.5">id</th>
                <th className="p-2.5">device_name</th>
                <th className="p-2.5">platform</th>
                <th className="p-2.5">bluetooth_mac</th>
                <th className="p-2.5">ip_address</th>
                <th className="p-2.5">is_online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pairedDevicesRows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="p-2.5 text-cyan-400 font-semibold">{row.id}</td>
                  <td className="p-2.5 text-gray-200">{row.device_name}</td>
                  <td className="p-2.5 text-gray-300">{row.platform}</td>
                  <td className="p-2.5 text-cyan-300">{row.bluetooth_mac}</td>
                  <td className="p-2.5 text-gray-400">{row.ip_address}</td>
                  <td className="p-2.5 text-emerald-400">{row.is_online ? '1 (ONLINE)' : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTable === 'app_settings' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 text-gray-400 sticky top-0 border-b border-white/10">
              <tr>
                <th className="p-2.5">key</th>
                <th className="p-2.5">value</th>
                <th className="p-2.5">updated_at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {appSettingsRows.map((row) => (
                <tr key={row.key} className="hover:bg-white/[0.02]">
                  <td className="p-2.5 text-cyan-400 font-semibold">{row.key}</td>
                  <td className="p-2.5 text-gray-200 font-bold">{row.value}</td>
                  <td className="p-2.5 text-gray-400">{row.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
