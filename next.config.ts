import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const fullRepo = process.env.GITHUB_REPOSITORY ?? "";
const [owner, repo] = fullRepo.split("/");
const isUserSite = repo && owner && repo.toLowerCase() === `${owner}.github.io`.toLowerCase();
const basePath = isGithubActions && repo && !isUserSite ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default createNextIntlPlugin()(nextConfig);
