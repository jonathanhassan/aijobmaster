import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { aiCoachChat, aiGenerateCoverLetter, aiScoreApplication } from "@/lib/ai.functions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ia")({ component: OutilsIA });

function OutilsIA() {
  return (
    <div>
      <PageHeader title="Outils IA" description="Propulsez vos candidatures avec Mammouth AI" />
      <Tabs defaultValue="coach">
        <TabsList className="mb-4">
          <TabsTrigger value="coach">Coach IA</TabsTrigger>
          <TabsTrigger value="lettre">Lettre</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
        </TabsList>
        <TabsContent value="coach"><CoachChat /></TabsContent>
        <TabsContent value="lettre"><CoverLetter /></TabsContent>
        <TabsContent value="score"><Scoring /></TabsContent>
      </Tabs>
    </div>
  );
}

function CoachChat() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const chat = useServerFn(aiCoachChat);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next = [...messages, { role: "user" as const, content: text }];
      setMessages(next);
      setInput("");
      const res = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant" as const, content: res.output }]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="glass-card rounded-xl flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
            Posez une question à votre coach IA. Il a le contexte de vos candidatures.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "gradient-primary text-white" : "bg-muted"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && <div className="text-sm text-muted-foreground"><Loader2 className="w-4 h-4 inline animate-spin" /> Réflexion...</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) send.mutate(input.trim()); }}
        className="border-t border-border p-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Que veux-tu savoir ?"
          className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <Button type="submit" disabled={!input.trim() || send.isPending} className="gradient-primary text-white border-0"><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}

function CoverLetter() {
  const [appId, setAppId] = useState("");
  const [output, setOutput] = useState("");
  const gen = useServerFn(aiGenerateCoverLetter);
  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await supabase.from("applications").select("id,title,company")).data ?? [],
  });
  const m = useMutation({
    mutationFn: async () => (await gen({ data: { applicationId: appId } })).output,
    onSuccess: (out) => { setOutput(out); toast.success("Lettre générée"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <select value={appId} onChange={(e) => setAppId(e.target.value)} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm">
        <option value="">— Sélectionner une candidature —</option>
        {apps.map((a: any) => <option key={a.id} value={a.id}>{a.title} · {a.company}</option>)}
      </select>
      <Button disabled={!appId || m.isPending} onClick={() => m.mutate()} className="gradient-primary text-white border-0">
        {m.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
        Générer
      </Button>
      {output && <textarea readOnly value={output} className="w-full min-h-[400px] bg-muted/30 border border-border rounded-lg p-3 text-sm" />}
    </div>
  );
}

function Scoring() {
  const [appId, setAppId] = useState("");
  const [score, setScore] = useState<any>(null);
  const sc = useServerFn(aiScoreApplication);
  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await supabase.from("applications").select("id,title,company")).data ?? [],
  });
  const m = useMutation({
    mutationFn: async () => await sc({ data: { applicationId: appId } }),
    onSuccess: (r) => { setScore(r); toast.success("Score calculé"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <select value={appId} onChange={(e) => setAppId(e.target.value)} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm">
        <option value="">— Sélectionner une candidature —</option>
        {apps.map((a: any) => <option key={a.id} value={a.id}>{a.title} · {a.company}</option>)}
      </select>
      <Button disabled={!appId || m.isPending} onClick={() => m.mutate()} className="gradient-primary text-white border-0">
        {m.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
        Calculer le score
      </Button>
      {score && (
        <div className="space-y-3">
          <div className="text-4xl font-bold gradient-text">{score.global}/100</div>
          <div className="text-sm font-semibold">{score.recommendation}</div>
          {score.strengths?.length > 0 && <div><div className="text-xs font-semibold mb-1">✅ Forces</div><ul className="text-sm space-y-1">{score.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul></div>}
          {score.gaps?.length > 0 && <div><div className="text-xs font-semibold mb-1">❌ Gaps</div><ul className="text-sm space-y-1">{score.gaps.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}
