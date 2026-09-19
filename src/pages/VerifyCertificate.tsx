import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BadgeCheck, Loader2, ShieldAlert, ShieldCheck, Download } from "lucide-react";
import { downloadCertificate, type CertificateData } from "@/lib/certificate";
import aiWingsLogo from "@/assets/aiwings-logo.png";

const VerifyCertificate = () => {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(certId ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc("verify_certificate", { p_certificate_id: id.trim() });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setResult(row as CertificateData);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) lookup(certId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = input.trim();
    if (!id) return;
    if (id !== certId) navigate(`/verify/${encodeURIComponent(id)}`);
    else lookup(id);
  };

  return (
    <main className="min-h-screen py-14 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 neural-grid opacity-30" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="container-x max-w-2xl">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to site
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <img src={aiWingsLogo} alt="The AI Wings" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="font-display font-bold text-3xl">Verify Certificate</h1>
            <p className="text-sm text-muted-foreground">Check whether a certificate issued by The AI Wings is genuine.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. AIW-2026-X4K2P"
            className="font-mono uppercase"
            autoFocus
          />
          <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </form>

        {result && (
          <div className="mt-8 rounded-2xl bg-gradient-card border border-primary/40 shadow-glow p-6 animate-fade-in">
            <div className="flex items-center gap-2 text-primary font-semibold mb-5">
              <ShieldCheck className="h-5 w-5" /> Valid certificate
            </div>
            <dl className="space-y-4">
              {[
                ["Certificate ID", result.certificate_id],
                ["Name", result.full_name],
                ["Event", result.event_title],
                ["Achievement", result.achievement_type],
                ["Issued on", new Date(result.issued_on).toLocaleDateString("en-IN", { dateStyle: "long" })],
                ["Issued by", result.issued_by],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <dt className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground sm:w-40 shrink-0">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-center gap-3">
              <Button variant="outline" onClick={() => downloadCertificate(result)}>
                <Download className="h-4 w-4 mr-2" /> Download certificate
              </Button>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified against official records
              </span>
            </div>
          </div>
        )}

        {notFound && (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
              <ShieldAlert className="h-5 w-5" /> Not found / Invalid
            </div>
            <p className="text-sm text-muted-foreground">
              Is ID ka koi certificate hamare records me nahi mila. ID dobara check karein — ya certificate fake ho sakta hai.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default VerifyCertificate;
