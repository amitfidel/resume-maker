import { ALL_STYLES, getStyle, type TemplateStyle } from "./styles";

export type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  style: TemplateStyle;
};

export const TEMPLATES: TemplateInfo[] = ALL_STYLES.map((style) => ({
  id: style.id,
  name: style.name,
  description: style.description,
  style,
}));

export function getTemplate(id: string): TemplateInfo {
  const style = getStyle(id);
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    style,
  };
}
