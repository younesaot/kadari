import { parseVideoUrl } from "@/lib/video-embed";

export function VideoPlayer({ url }: { url: string }) {
  const { embedUrl } = parseVideoUrl(url);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );
}