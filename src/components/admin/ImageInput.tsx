import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageInput = ({ value, onChange, label = "Image" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <div className="flex gap-1 text-[10px] font-mono">
          <button type="button" onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
            Upload
          </button>
          <button type="button" onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded ${mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
            URL
          </button>
        </div>
      </div>

      {value && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {mode === "upload" ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()} className="w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Uploading..." : value ? "Replace image" : "Choose image"}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input type="url" placeholder="https://..." value={value} onChange={e => onChange(e.target.value)} className="pl-8" />
        </div>
      )}
    </div>
  );
};
