// components/GitHubStarsWrapper.tsx
import { Suspense } from "react";

import GitHubStarsButton from "./github-star-button";

interface GitHubResponse {
  stargazers_count: number;
}

async function getGitHubStars(owner: string, repo: string) {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "NextJS-App",
    };
    
    // 只有在token存在时才添加授权头
    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`GitHub API请求失败: ${res.status} ${res.statusText}`);
      // 返回默认值而不是抛出错误
      return 0;
    }

    const data: GitHubResponse = await res.json();
    return data.stargazers_count;
  } catch (error) {
    console.error("获取GitHub星标时出错:", error);
    // 出错时返回默认值
    return 0;
  }
}

interface Props {
  owner: string;
  repo: string;
  className?: string;
}

async function GitHubStarsWrapper({ owner, repo, className }: Props) {
  const stars = await getGitHubStars(owner, repo);

  return (
    <GitHubStarsButton
      owner={owner}
      repo={repo}
      className={className}
      initialStars={stars}
    />
  );
}

// 导出一个包装了 Suspense 的组件
export default function GitHubStarsWithSuspense(props: Props) {
  return (
    <Suspense fallback={<GitHubStarsButton {...props} />}>
      <GitHubStarsWrapper {...props} />
    </Suspense>
  );
}
