import { codeToHtml } from "shiki";

export async function CodeBlock({
  code,
  filename,
  lang = "text",
}: {
  code: string;
  filename?: string;
  lang?: string;
}) {
  const html = await codeToHtml(code, { lang, theme: "dark-plus" });

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-xl shadow-primary/10">
      {filename && (
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 font-mono text-xs text-white/40">{filename}</span>
        </div>
      )}
      <div
        className="overflow-x-auto p-4 text-[13px] leading-relaxed [&_code]:font-mono [&_pre]:!bg-transparent [&_pre]:!p-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
