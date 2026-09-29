import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, ExternalLink, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QRCard({ verificationId, qrUrl, qrDataUrl }) {
  const fullPublicUrl = `${window.location.origin}${qrUrl || `/verify/${verificationId}`}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
        <QrCode className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1">Public Verification QR</h3>
      <p className="text-xs text-slate-500 mb-4 max-w-xs">
        Scan with any mobile camera or QR reader to verify document integrity on the public portal.
      </p>

      {/* QR Code Container */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-4">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Verification QR" className="w-40 h-40" />
        ) : (
          <QRCodeSVG value={fullPublicUrl} size={160} level="H" />
        )}
      </div>

      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-md mb-4 select-all">
        {verificationId}
      </span>

      <div className="flex gap-2 w-full">
        <Link
          to={`/verify/${verificationId}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Public Verify
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>
    </div>
  );
}
