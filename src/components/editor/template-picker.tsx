"use client";

import { TEMPLATES } from "@/templates/registry";
import { changeTemplate } from "@/app/(dashboard)/resumes/actions";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  resumeId: string;
  currentTemplateId: string;
};

export function TemplatePicker({ resumeId, currentTemplateId }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Template</h3>
      <div className="space-y-1.5">
        {TEMPLATES.map((tpl) => {
          const isActive = tpl.id === currentTemplateId;
          return (
            <button
              key={tpl.id}
              onClick={() => {
                if (!isActive) changeTemplate(resumeId, tpl.id);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {tpl.description}
                </p>
              </div>
              {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
