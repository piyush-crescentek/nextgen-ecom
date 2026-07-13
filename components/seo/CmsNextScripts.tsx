import Script from "next/script";
import type { CmsParsedScript } from "@/lib/parse-cms-script-markup";

export default function CmsNextScripts({
  scripts,
  strategyOverride,
}: {
  scripts: CmsParsedScript[];
  strategyOverride?: CmsParsedScript["strategy"];
}) {
  if (scripts.length === 0) return null;
  return (
    <>
      {scripts.map((s) =>
        s.src ? (
          <Script
            key={s.id}
            id={s.id}
            src={s.src}
            strategy={strategyOverride ?? s.strategy}
          />
        ) : (
          <Script key={s.id} id={s.id} strategy={strategyOverride ?? s.strategy}>
            {s.content}
          </Script>
        ),
      )}
    </>
  );
}
