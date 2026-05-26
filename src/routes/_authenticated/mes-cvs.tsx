import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mes-cvs")({ component: MesCVs });

function MesCVs() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: cvs = [] } = useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      const { data } = await supabase.from("cvs").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Max 5MB");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Non connecté");
      const path = `${u.user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("cvs").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
      const { error } = await supabase.from("cvs").insert({
        user_id: u.user.id, name: name || file.name.replace(/\.pdf$/i, ""), pdf_url: urlData.publicUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("CV ajouté"); qc.invalidateQueries({ queryKey: ["cvs"] }); setName(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cvs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("CV supprimé"); qc.invalidateQueries({ queryKey: ["cvs"] }); },
  });

  return (
    <div>
      <PageHeader title="Mes CVs" description="Gérez votre bibliothèque" />
      <div className="glass-card rounded-xl p-6 mb-6">
        <Input placeholder="Nom du CV (optionnel)" value={name} onChange={(e) => setName(e.target.value)} className="mb-3" />
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition">
          <FileText className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Cliquez ou glissez un PDF (max 5MB)</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) upload.mutate(f);
          }} />
        </label>
      </div>
      {cvs.length === 0 ? (
        <EmptyState title="Aucun CV" description="Uploadez votre premier CV." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv: any) => (
            <div key={cv.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium">{cv.name}</span>
                </div>
                {cv.is_default && <Star className="w-4 h-4 text-warning" />}
              </div>
              <div className="text-xs text-muted-foreground">Version {cv.version} · Score {cv.average_ats_score}/100</div>
              <div className="flex gap-2 mt-3">
                {cv.pdf_url && <Button size="sm" variant="outline" asChild><a href={cv.pdf_url} target="_blank" rel="noopener noreferrer">Ouvrir</a></Button>}
                <Button size="sm" variant="ghost" onClick={() => del.mutate(cv.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
