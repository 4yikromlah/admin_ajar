/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Database } from 'lucide-react';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  spreadsheetUrl?: string;
  isSyncing: boolean;
  syncError?: string | null;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  compact?: boolean;
}

export default function SyncStatusIndicator({
  isOnline,
  spreadsheetUrl,
  isSyncing,
  syncError,
  lastSyncTime,
  onManualSync,
  compact = false,
}: SyncStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const hasUrl = Boolean(spreadsheetUrl && spreadsheetUrl.trim());

  let statusType: 'online' | 'syncing' | 'offline' | 'error' | 'no_url' = 'online';

  if (isSyncing) {
    statusType = 'syncing';
  } else if (!isOnline) {
    statusType = 'offline';
  } else if (!hasUrl) {
    statusType = 'no_url';
  } else if (syncError) {
    statusType = 'error';
  } else {
    statusType = 'online';
  }

  const formatLastSync = (date: Date | null | undefined) => {
    if (!date) return 'Belum pernah';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          if (hasUrl && isOnline && onManualSync && !isSyncing) {
            onManualSync();
          }
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 rounded-xl transition-all cursor-pointer font-semibold ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          statusType === 'syncing'
            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
            : statusType === 'online'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-100'
            : statusType === 'error'
            ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-100'
            : statusType === 'offline'
            ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
            : 'bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
        }`}
        id="sync-status-indicator"
        title="Klik untuk menyinkronkan data dengan Google Sheets"
      >
        {statusType === 'syncing' && (
          <>
            <RefreshCw size={compact ? 13 : 15} className="animate-spin text-blue-600 shrink-0" />
            <span className={compact ? 'hidden sm:inline' : ''}>Menyinkronkan...</span>
          </>
        )}

        {statusType === 'online' && (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi size={compact ? 13 : 15} className="text-emerald-600 shrink-0" />
            <span className={compact ? 'hidden sm:inline' : ''}>Sheets Terhubung</span>
          </>
        )}

        {statusType === 'offline' && (
          <>
            <WifiOff size={compact ? 13 : 15} className="text-amber-600 shrink-0" />
            <span className={compact ? 'hidden sm:inline' : ''}>Mode Offline</span>
          </>
        )}

        {statusType === 'no_url' && (
          <>
            <Database size={compact ? 13 : 15} className="text-slate-500 shrink-0" />
            <span className={compact ? 'hidden sm:inline' : ''}>Mode Lokal</span>
          </>
        )}

        {statusType === 'error' && (
          <>
            <AlertCircle size={compact ? 13 : 15} className="text-rose-600 shrink-0" />
            <span className={compact ? 'hidden sm:inline' : ''}>Gagal Sinkron</span>
          </>
        )}
      </button>

      {/* Tooltip / Status Details */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-slate-900/95 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none space-y-1 backdrop-blur-sm border border-slate-700">
          <div className="font-bold flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
            <span>Status Sinkronisasi</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              {statusType === 'online' ? 'Terhubung' : statusType === 'syncing' ? 'Sync' : 'Offline'}
            </span>
          </div>
          <p className="text-slate-300 leading-normal">
            {statusType === 'online' && 'Aplikasi terhubung dengan Google Sheets. Klik indikator untuk sinkronisasi ulang.'}
            {statusType === 'syncing' && 'Sedang menyinkronkan data dengan Google Sheets...'}
            {statusType === 'offline' && 'Jaringan internet terputus. Bekerja penuh dalam mode offline (tersimpan di memori lokal).'}
            {statusType === 'no_url' && 'URL Google Sheets belum diset. Data tersimpan di database lokal browser.'}
            {statusType === 'error' && `Terjadi kendala sinkronisasi: ${syncError || 'Gagal terhubung ke Apps Script.'}`}
          </p>
          <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 flex justify-between items-center">
            <span>Terakhir Sinkron:</span>
            <span className="text-emerald-400 font-semibold">{formatLastSync(lastSyncTime)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
