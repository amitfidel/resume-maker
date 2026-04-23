"use client";

import { TEMPLATES } from "@/templates/registry";
import { changeTemplate } from "@/app/(dashboard)/resumes/actions";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { TemplateStyle } from "@/templates/styles";

type Props = {
  resumeId: string;
  currentTemplateId: string;
};

export function TemplatePicker({ resumeId, currentTemplateId }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {TEMPLATES.map((tpl) => {
        const isActive = tpl.id === currentTemplateId;
        return (
          <button
            key={tpl.id}
            onClick={() => {
              if (!isActive) changeTemplate(resumeId, tpl.id);
            }}
            className={cn(
              "group relative overflow-hidden rounded-[12px] bg-[var(--surface-raised)] text-left transition-all duration-[var(--t-mid)] hover:-translate-y-0.5",
              isActive
                ? "shadow-[inset_0_0_0_2px_var(--ink),var(--sh-3)]"
                : "shadow-[inset_0_0_0_1px_var(--border-ghost),var(--sh-1)] hover:shadow-[inset_0_0_0_1px_var(--border-ghost-strong),var(--sh-2)]",
            )}
            title={tpl.description}
          >
            <TemplateThumbnail style={tpl.style} />
            <div className="bg-[var(--surface-raised)] p-3">
              <p className="truncate text-[13px] font-medium text-[var(--on-surface)]">
                {tpl.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--on-surface-muted)]">
                {tpl.description}
              </p>
            </div>
            {isActive && (
              <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--ink)] text-[var(--cream)]">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mini visual preview of a template using its actual style tokens.
 * Not a full resume - just a suggestive sketch showing the header style,
 * typography, and color choices.
 */
function TemplateThumbnail({ style }: { style: TemplateStyle }) {
  if (style.layout === "two-column") {
    return (
      <div
        className="h-32 flex"
        style={{ fontFamily: style.fontFamily, backgroundColor: "white" }}
      >
        <div
          className="w-[38%] p-1.5"
          style={{ backgroundColor: style.sidebarBg }}
        >
          <div
            className="h-2 w-[80%] rounded-sm"
            style={{ backgroundColor: style.sidebarTextColor, opacity: 0.9 }}
          />
          <div className="mt-1.5 space-y-0.5">
            <div
              className="h-0.5 w-[60%] rounded-sm"
              style={{ backgroundColor: style.sidebarTextColor, opacity: 0.4 }}
            />
            <div
              className="h-0.5 w-[70%] rounded-sm"
              style={{ backgroundColor: style.sidebarTextColor, opacity: 0.4 }}
            />
          </div>
          <div
            className="mt-2 h-0.5 w-[50%] rounded-sm"
            style={{ backgroundColor: style.sidebarTextColor, opacity: 0.7 }}
          />
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-[90%] rounded-sm" style={{ backgroundColor: style.sidebarTextColor, opacity: 0.3 }} />
            <div className="h-0.5 w-[80%] rounded-sm" style={{ backgroundColor: style.sidebarTextColor, opacity: 0.3 }} />
          </div>
        </div>
        <div className="flex-1 p-1.5">
          <div className="h-1 w-[40%] rounded-sm" style={{ backgroundColor: style.sectionHeading.color }} />
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-[90%] rounded-sm bg-gray-300" />
            <div className="h-0.5 w-[75%] rounded-sm bg-gray-300" />
          </div>
          <div className="mt-2 h-1 w-[35%] rounded-sm" style={{ backgroundColor: style.sectionHeading.color }} />
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-[85%] rounded-sm bg-gray-300" />
            <div className="h-0.5 w-[70%] rounded-sm bg-gray-300" />
          </div>
        </div>
      </div>
    );
  }

  // Single-column layouts
  return (
    <div
      className="h-32 p-2"
      style={{
        fontFamily: style.fontFamily,
        backgroundColor: "white",
        textAlign: style.header.align,
      }}
    >
      {style.header.style === "accent-bar" && (
        <div
          className="h-0.5 w-[15%] mb-1"
          style={{ backgroundColor: style.accentBarColor }}
        />
      )}
      {/* Name */}
      <div
        className="mx-auto h-2 rounded-sm"
        style={{
          width: style.header.align === "center" ? "60%" : "70%",
          backgroundColor: style.header.nameColor,
          marginLeft: style.header.align === "center" ? "auto" : 0,
          marginRight: style.header.align === "center" ? "auto" : undefined,
        }}
      />
      {/* Subtitle */}
      <div
        className="mt-1 h-0.5 rounded-sm"
        style={{
          width: style.header.align === "center" ? "40%" : "50%",
          backgroundColor: style.mutedColor,
          marginLeft: style.header.align === "center" ? "auto" : 0,
          marginRight: style.header.align === "center" ? "auto" : undefined,
        }}
      />
      {/* Divider */}
      {style.header.style === "bordered-bottom" && (
        <div
          className="mt-1.5"
          style={{ borderBottom: `2px solid ${style.primaryColor}` }}
        />
      )}
      {/* Content */}
      <div className="mt-2 text-left">
        <div
          className="h-1 w-[30%] rounded-sm"
          style={{ backgroundColor: style.sectionHeading.color }}
        />
        <div
          className="mt-0.5"
          style={{
            borderBottom:
              style.sectionHeading.border !== "none"
                ? `1px solid ${style.dividerColor}`
                : "none",
          }}
        />
        <div className="mt-1 space-y-0.5">
          <div className="h-0.5 w-[90%] rounded-sm bg-gray-300" />
          <div className="h-0.5 w-[80%] rounded-sm bg-gray-300" />
          <div className="h-0.5 w-[85%] rounded-sm bg-gray-300" />
        </div>
      </div>
    </div>
  );
}
