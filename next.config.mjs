const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/hakuou-exhibition-survey";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? githubPagesBasePath : undefined,
  assetPrefix: isGithubPages ? `${githubPagesBasePath}/` : undefined,
  trailingSlash: isGithubPages,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
