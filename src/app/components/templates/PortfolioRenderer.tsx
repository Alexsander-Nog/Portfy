import type { ComponentType } from "react";
import type { PortfolioTemplateId } from "../../types";
import type { PortfolioTemplateProps } from "./types";
import { ModernPortfolio } from "./portfolio/ModernPortfolio";
import { MinimalPortfolio } from "./portfolio/MinimalPortfolio";
import { DarkPortfolio } from "./portfolio/DarkPortfolio";
import { GradientPortfolio } from "./portfolio/GradientPortfolio";

const PORTFOLIO_COMPONENTS: Record<PortfolioTemplateId, ComponentType<PortfolioTemplateProps>> = {
  modern: ModernPortfolio,
  minimal: MinimalPortfolio,
  dark: DarkPortfolio,
  gradient: GradientPortfolio,
};

export interface PortfolioRendererProps extends PortfolioTemplateProps {
  template: PortfolioTemplateId;
}

export function PortfolioRenderer({ template, ...props }: PortfolioRendererProps) {
  const Component = PORTFOLIO_COMPONENTS[template] ?? ModernPortfolio;
  return <Component {...props} />;
}
