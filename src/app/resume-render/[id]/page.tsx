import { resolveResume } from "@/lib/resume/resolve";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/templates/renderer";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResumeRenderPage({ params }: Props) {
  const { id } = await params;

  const resolved = await resolveResume(id);
  if (!resolved) notFound();

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: white; }
              @page { margin: 0; size: A4; }
            `,
          }}
        />
      </head>
      <body>
        <TemplateRenderer resume={resolved} />
      </body>
    </html>
  );
}
