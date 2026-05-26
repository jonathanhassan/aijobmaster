import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profil")({ component: Profil });

function Profil() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("profiles").update({
        first_name: form.first_name, last_name: form.last_name, phone: form.phone,
        linkedin: form.linkedin, github: form.github, current_title: form.current_title,
        years_experience: Number(form.years_experience) || 0, location: form.location,
        bio: form.bio, pitch_30s: form.pitch_30s,
      }).eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil sauvegardé ✅"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const f = (k: string) => ({ value: form[k] ?? "", onChange: (e: any) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Mon Profil" description={`Complété à ${profile?.profile_completion ?? 0}%`} />
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Prénom</Label><Input {...f("first_name")} /></div>
          <div><Label>Nom</Label><Input {...f("last_name")} /></div>
          <div><Label>Téléphone</Label><Input {...f("phone")} /></div>
          <div><Label>Localisation</Label><Input {...f("location")} /></div>
          <div><Label>LinkedIn</Label><Input {...f("linkedin")} /></div>
          <div><Label>GitHub</Label><Input {...f("github")} /></div>
          <div><Label>Titre actuel</Label><Input {...f("current_title")} /></div>
          <div><Label>Années d'exp.</Label><Input type="number" {...f("years_experience")} /></div>
        </div>
        <div><Label>Bio</Label><textarea {...f("bio")} className="w-full min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
        <div><Label>Pitch 30s</Label><textarea {...f("pitch_30s")} className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gradient-primary text-white border-0">Sauvegarder</Button>
      </div>
    </div>
  );
}
