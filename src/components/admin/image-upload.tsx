"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/** Sube una imagen al bucket "media" de Supabase y guarda su URL pública en un campo oculto. */
export function ImageUpload({ name, label, folder, defaultValue }: { name: string; label: string; folder: string; defaultValue: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setStatus("Formato no permitido (JPG, PNG o WebP).");
    if (file.size > MAX_BYTES) return setStatus("La imagen supera 5 MB.");
    const supabase = getBrowserClient();
    if (!supabase) return;
    setStatus("Subiendo…");
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) return setStatus("No se pudo subir la imagen.");
    setUrl(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    setStatus("Imagen lista. Recuerda guardar el comercio.");
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="img-placeholder h-14 w-14 rounded-lg" />
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0])} className="text-xs" />
      </div>
      {url && (
        <button type="button" onClick={() => setUrl("")} className="mt-1 text-xs text-danger underline">Quitar imagen</button>
      )}
      {status && <p className="mt-1 text-xs text-muted">{status}</p>}
    </div>
  );
}
