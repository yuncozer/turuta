"use client";

import { useEffect, useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- el dominio solo se conoce en el navegador
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}${path}`;
  return (
    <div className="mt-3 flex gap-2">
      <input readOnly value={url} className="w-full rounded-lg border border-line bg-cream px-2 py-1.5 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="shrink-0 rounded-lg bg-brand-700 px-3 text-xs font-semibold text-white"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
