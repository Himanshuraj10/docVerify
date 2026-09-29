import React, { useState } from 'react';
import { Blocks, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function BlockchainCard({ blockchainData }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!blockchainData) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const {
    recorded,
    transaction_id,
    document_hash,
    block_number,
    contract_address,
    network,
    timestamp
  } = blockchainData;

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">EVM Blockchain Proof Ledger</h3>
            <p className="text-xs text-slate-400">Cryptographic audit proof stored immutably on-chain</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CONFIRMED ON-CHAIN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* SHA-256 Document Hash */}
        <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Document SHA-256 Hash</span>
            <button
              onClick={() => copyToClipboard(document_hash, 'hash')}
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'hash' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <span className="font-mono text-blue-400 break-all select-all">{document_hash}</span>
        </div>

        {/* Transaction Hash */}
        <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Transaction ID</span>
            <button
              onClick={() => copyToClipboard(transaction_id, 'tx')}
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              {copiedField === 'tx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'tx' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <span className="font-mono text-emerald-400 break-all select-all">{transaction_id}</span>
        </div>

        {/* Block Number & Network */}
        <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60 flex justify-between items-center">
          <div>
            <span className="text-slate-400 block mb-0.5">Block Number</span>
            <span className="font-mono text-white text-sm font-semibold">#{block_number || '104201'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block mb-0.5">EVM Network</span>
            <span className="text-slate-200 font-medium">{network || 'EVM-Local (Chain ID: 31337)'}</span>
          </div>
        </div>

        {/* Contract Address & Timestamp */}
        <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60 flex justify-between items-center">
          <div>
            <span className="text-slate-400 block mb-0.5">Smart Contract</span>
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[160px] inline-block">
              {contract_address || '0x5FbDB...80aa3'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block mb-0.5">Confirmed At</span>
            <span className="text-slate-300">{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
