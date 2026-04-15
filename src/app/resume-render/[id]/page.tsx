import { resolveResume } from "@/lib/resume/resolve";
import { notFound } from "next/navigation";
import { getTemplate } from "@/templates/registry";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResumeRenderPage({ params }: Props) {
  const { id } = await params;

  const resolved = await resolveResume(id);
  if (!resolved) notFound();

  const template = getTemplate(resolved.templateId);
  const TemplateComponent = template.component;

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: white; }
              @page { margin: 0; size: A4; }
            `,
          }}
        />
      </head>
      <body>
        <TemplateComponent resume={resolved} mode="export" />
      </body>
    </html>
  );
}
