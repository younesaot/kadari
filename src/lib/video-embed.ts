export type VideoKind = "youtube" | "vimeo" | "drive" | "other";

export function parseVideoUrl(url: string): { kind: VideoKind; embedUrl: string; thumbnail?: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}`, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? "";
      return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}`, thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined };
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` };
    }
    if (host.endsWith("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] ?? u.searchParams.get("id") ?? "";
      return { kind: "drive", embedUrl: `https://drive.google.com/file/d/${id}/preview` };
    }
    return { kind: "other", embedUrl: url };
  } catch {
    return { kind: "other", embedUrl: url };
  }
}