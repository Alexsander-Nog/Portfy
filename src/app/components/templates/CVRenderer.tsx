import type { ComponentType } from "react";
import type { CvTemplateId } from "../../types";
import type { CVTemplateProps } from "./types";
import { ModernCV } from "./cv/ModernCV";
import { MinimalCV } from "./cv/MinimalCV";
import { CreativeCV } from "./cv/CreativeCV";
import { ExecutiveCV } from "./cv/ExecutiveCV";
import { ModernClassicCV } from "./cv/ModernClassicCV";
import { MinimalElegantCV } from "./cv/MinimalElegantCV";
import { CorporateCV } from "./cv/CorporateCV";
import { CreativeAccentCV } from "./cv/CreativeAccentCV";

const CV_COMPONENTS: Record<CvTemplateId, ComponentType<CVTemplateProps>> = {
  modern: ModernCV,
  minimal: MinimalCV,
  creative: CreativeCV,
  executive: ExecutiveCV,
  modernClassic: ModernClassicCV,
  minimalElegant: MinimalElegantCV,
  corporate: CorporateCV,
  creativeAccent: CreativeAccentCV,
};

export interface CVRendererProps extends CVTemplateProps {
  template: CvTemplateId;
}

export function CVRenderer({ template, ...props }: CVRendererProps) {
  const Component = CV_COMPONENTS[template] ?? ModernCV;
  return <Component {...props} />;
}
