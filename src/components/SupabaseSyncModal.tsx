import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  SQL_SCHEMA_SCRIPT
} from '../lib/supabase';
import { supabaseService, SupabaseHealthStatus } from '../services/supabaseService';
import { Photo } from '../types';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: SupabaseHealthStatus | null;
  onRefreshHealth: () => void;
  onSeedDatabase: (photos: Photo[]) => void;
  photos: Photo[];
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth,
  onSeedDatabase,
  photos
}) => {
  const [copied, setCopied] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await supabaseService.seedPhotos(photos);
    setIsSeeding(false);
    if (res.error) {
      setSeedResult(`Error: ${res.error}`);
    } else {
      setSeedResult(`✓ Successfully seeded ${res.count} master photographs into Supabase table public.photos`);
      onSeedDatabase(photos);
      onRefreshHealth();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#181513] text-[#eae5de] rounded-2xl max-w-2xl w-full border border-[#3b342e] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#2d2825] flex items-center justify-between bg-[#1f1b18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2b6e4e]/20 text-[#2b6e4e] border border-[#2b6e4e]/40 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-white">
                  Supabase Backend Configuration
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-[#a09789] mt-0.5">
                Real-time PostgreSQL database & authentication engine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8a8175] hover:text-white hover:bg-[#2a2420] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Connection Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#131110] rounded-xl border border-[#2d2825]">
              <div className="text-[10px] text-[#8a8175]">PROJECT ID</div>
              <div className="text-white font-semibold truncate mt-1">{SUPABASE_PROJECT_ID}</div>
            </div>
            <div className="p-3 bg-[#131110] rounded-xl border border-[#2d2825]">
              <div className="text-[10px] text-[#8a8175]">REST ENDPOINT</div>
              <div className="text-white font-semibold truncate mt-1">
                {SUPABASE_URL.replace('https://', '')}
              </div>
            </div>
            <div className="p-3 bg-[#131110] rounded-xl border border-[#2d2825]">
              <div className="text-[10px] text-[#8a8175]">TABLE CACHE STATUS</div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {health?.tableExists ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>photos (Ready)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Schema Setup Required</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Table Schema Status Message */}
          {!health?.tableExists ? (
            <div className="bg-[#241f19] border border-[#4a3f31] rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>Next Step: Create the `photos` table in your Supabase SQL Editor</span>
              </div>
              <p className="text-[#c8bcad] text-xs leading-relaxed">
                Your Supabase API key and connection are verified. Copy the SQL script below and paste it into your
                Supabase Dashboard (<span className="font-mono text-amber-200">SQL Editor &gt; New Query</span>), then click Run.
              </p>
            </div>
          ) : (
            <div className="bg-[#1a2e22] border border-[#2d593e] rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supabase `photos` Table is Live!</span>
              </div>
              <p className="text-[#b1dac0] text-xs leading-relaxed">
                All changes, uploads, deletions, favorites, and client proofing reviews synchronize with your remote
                PostgreSQL database in Supabase.
              </p>
            </div>
          )}

          {/* SQL Setup Script Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-[#b5aba0] tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#c45a2c]" />
                <span>PostgreSQL Schema SQL (Idempotent DDL)</span>
              </label>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1 bg-[#26211d] hover:bg-[#332c26] text-white border border-[#3d3630] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-[#100e0d] border border-[#2d2825] rounded-xl text-[11px] font-mono text-[#a59b8c] overflow-x-auto max-h-56 leading-relaxed">
                {SQL_SCHEMA_SCRIPT}
              </pre>
            </div>
          </div>

          {seedResult && (
            <div
              className={`p-3 rounded-lg text-xs font-mono ${
                seedResult.startsWith('✓')
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}
            >
              {seedResult}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-[#2d2825] bg-[#1a1714] flex flex-wrap items-center justify-between gap-3">
          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#c45a2c] hover:underline flex items-center gap-1.5"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex gap-2">
            <button
              onClick={onRefreshHealth}
              className="px-3.5 py-2 border border-[#3d3630] hover:bg-[#25201c] rounded-lg text-xs text-[#cfc7ba] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Test Connection</span>
            </button>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2 bg-[#2b6e4e] hover:bg-[#23583e] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Seeding...' : 'Seed 10 Master Plates to Supabase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
