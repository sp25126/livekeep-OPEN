'use client';

import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Settings2, 
  Layers, 
  ExternalLink,
  Laptop
} from 'lucide-react';

interface TallyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onRefreshStatus?: () => void;
}

export default function TallyConnectModal({
  isOpen,
  onClose,
  isConnected,
  onRefreshStatus
}: TallyConnectModalProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/tally/status', { cache: 'no-store' });
      const data = await res.json();
      setTestResult({
        success: data.connected,
        message: data.connected
          ? 'Successfully connected to Tally Prime XML server on port 9000!'
          : 'Could not connect to Tally Prime on port 9000. Ensure Tally Prime is running with XML Server enabled.'
      });
      if (onRefreshStatus) onRefreshStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Network error checking Tally Prime endpoint.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-2xl bg-[#232528] text-[#f5ba41] flex items-center justify-center font-black">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#232528]">Connect Tally Prime</h3>
              <p className="text-[11px] text-[#88898b]">Local XML & ODBC Synchronization Bridge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f6f5f0] text-[#88898b] hover:text-[#232528] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isConnected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-extrabold text-xs">
                {isConnected ? 'Tally Prime Online & Connected' : 'Tally Prime Not Connected'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Target Endpoint: <code className="font-mono font-bold">http://localhost:9000</code>
              </div>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 bg-white border shadow-xs hover:bg-[#fafaf8]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Port'}</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs font-medium border ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-[#232528] uppercase tracking-wider">
            Quick 3-Step Setup
          </h4>

          <div className="space-y-2.5 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#e5e3dc] flex items-start gap-3 shadow-xs">
              <span className="h-6 w-6 rounded-full bg-[#f6f5f0] text-[#232528] font-black text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <strong className="text-[#232528] block">Open Tally Prime on your PC</strong>
                <span className="text-[#88898b] text-[11px] mt-0.5 block">
                  Launch Tally Prime and make sure your company is selected and opened.
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#e5e3dc] flex items-start gap-3 shadow-xs">
              <span className="h-6 w-6 rounded-full bg-[#f6f5f0] text-[#232528] font-black text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <strong className="text-[#232528] block">Enable XML/ODBC Server on Port 9000</strong>
                <span className="text-[#88898b] text-[11px] mt-0.5 block">
                  In Tally Prime, press <kbd className="font-mono px-1 py-0.5 bg-[#f6f5f0] rounded">F1: Help</kbd> &rarr; <strong>Settings</strong> &rarr; <strong>Connectivity</strong>. Set <em>TallyPrime acts as</em>: <strong>Both</strong>, and <em>Port</em>: <strong>9000</strong>. Restart Tally if prompted.
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#e5e3dc] flex items-start gap-3 shadow-xs">
              <span className="h-6 w-6 rounded-full bg-[#f6f5f0] text-[#232528] font-black text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <strong className="text-[#232528] block">Start the Live Sync Bridge</strong>
                <span className="text-[#88898b] text-[11px] mt-0.5 block">
                  Run the terminal connector command in your project directory:
                </span>
                <div className="mt-1.5 p-2 bg-[#232528] rounded-xl text-white font-mono text-[11px] flex items-center justify-between">
                  <code>npm run tally:sync</code>
                  <span className="text-[10px] text-[#f5ba41]">or start-tally-sync.bat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#232528] text-white hover:bg-black font-bold rounded-2xl text-xs transition"
          >
            Done / Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
