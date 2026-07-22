import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, PlayCircle, FileText, Megaphone, BookOpen, Pin } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";

interface Video { id: string; title: string; description: string | null; url: string; thumbnail_url: string | null; }
interface FileRow { id: string; title: string; description: string | null; url: string; }
interface ImageRow { id: string; title: string | null; public_url: string; }
interface Lesson { id: string; title: string; content: string | null; }
interface Announcement { id: string; title: string; body: string; pinned: boolean; published_at: string; }

export function StudentLessons() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["s_lessons"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("id,title,content").eq("published", true).order("sort_order").order("created_at", { ascending: false });
      return (data ?? []) as Lesson[];
    },
  });
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty icon={BookOpen} text="لا توجد دروس منشورة." />;
  return (
    <div className="grid gap-4">
      {data.map((l) => (
        <Card key={l.id}>
          <CardHeader><CardTitle className="text-lg">{l.title}</CardTitle></CardHeader>
          {l.content && <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{l.content}</CardContent>}
        </Card>
      ))}
    </div>
  );
}

export function StudentVideos() {
  const qc = useQueryClient();
  const [playing, setPlaying] = useState<Video | null>(null);
  const inc = useMutation({
    mutationFn: async (id: string) => { await supabase.rpc("increment_video_views", { _video_id: id }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["s_videos"] }),
  });
  const { data = [], isLoading } = useQuery({
    queryKey: ["s_videos"],
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("id,title,description,url,thumbnail_url").eq("published", true).order("sort_order").order("created_at", { ascending: false });
      return (data ?? []) as Video[];
    },
  });
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty icon={PlayCircle} text="لا توجد فيديوهات منشورة." />;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((v) => (
          <button key={v.id} onClick={() => { setPlaying(v); inc.mutate(v.id); }} className="group overflow-hidden rounded-xl border bg-card text-right transition hover:shadow-md">
            <div className="relative aspect-video bg-muted">
              {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} className="h-full w-full object-cover" /> : null}
              <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition group-hover:opacity-100"><PlayCircle className="h-12 w-12 text-white" /></div>
            </div>
            <div className="p-3">
              <div className="line-clamp-2 font-medium">{v.title}</div>
              {v.description && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</div>}
            </div>
          </button>
        ))}
      </div>
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{playing?.title}</DialogTitle></DialogHeader>
          {playing && <VideoPlayer url={playing.url} />}
          {playing?.description && <p className="text-sm text-muted-foreground">{playing.description}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudentFiles() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["s_files"],
    queryFn: async () => {
      const { data } = await supabase.from("files").select("id,title,description,url").eq("published", true).order("sort_order").order("created_at", { ascending: false });
      return (data ?? []) as FileRow[];
    },
  });
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty icon={FileText} text="لا توجد ملفات منشورة." />;
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {data.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="font-medium">{f.title}</div>
            {f.description && <div className="line-clamp-1 text-xs text-muted-foreground">{f.description}</div>}
          </div>
          <Button asChild size="sm" variant="outline"><a href={f.url} target="_blank" rel="noreferrer"><ExternalLink className="ml-1 h-4 w-4" /> فتح</a></Button>
        </li>
      ))}
    </ul>
  );
}

export function StudentImages() {
  const [preview, setPreview] = useState<ImageRow | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["s_images"],
    queryFn: async () => {
      const { data } = await supabase.from("images").select("id,title,public_url").order("created_at", { ascending: false });
      return (data ?? []) as ImageRow[];
    },
  });
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty icon={FileText} text="لا توجد صور." />;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((r) => (
          <button key={r.id} onClick={() => setPreview(r)} className="overflow-hidden rounded-lg border">
            <img src={r.public_url} alt={r.title ?? ""} className="aspect-square w-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{preview?.title ?? "صورة"}</DialogTitle></DialogHeader>
          {preview && <img src={preview.public_url} alt={preview.title ?? ""} className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudentAnnouncements() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["s_announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("id,title,body,pinned,published_at").order("pinned", { ascending: false }).order("published_at", { ascending: false });
      return (data ?? []) as Announcement[];
    },
  });
  if (isLoading) return <Loading />;
  if (!data.length) return <Empty icon={Megaphone} text="لا توجد إعلانات." />;
  return (
    <div className="grid gap-3">
      {data.map((a) => (
        <Card key={a.id} className={a.pinned ? "border-primary/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {a.pinned && <Pin className="h-4 w-4 text-primary" />}
              {a.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</CardContent>
        </Card>
      ))}
    </div>
  );
}

function Loading() { return <div className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>; }
function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border bg-card p-12 text-center">
      <Icon className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}