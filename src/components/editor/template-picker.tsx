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
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Template</h3>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((tpl) => {
          const isActive = tpl.id === currentTemplateId;
          return (
            <button
              key={tpl.id}
              onClick={() => {
                if (!isActive) changeTemplate(resumeId, tpl.id);
              }}
              className={cn(
                "group relative rounded-lg overflow-hidden border-2 transition-all",
                isActive
                  ? "border-primary shadow-sm"
                  : "border-transparent hover:border-gray-300"
              )}
              title={tpl.description}
            >
              <TemplateThumbnail style={tpl.style} />
              <div className="bg-white p-2 text-left">
                <p className="text-[0.7rem] font-semibold truncate">{tpl.name}</p>
              </div>
              {isActive && (
                <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
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
        className="h-24 flex"
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
      className="h-24 p-2"
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
