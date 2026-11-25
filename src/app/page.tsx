"use client";

import dynamic from "next/dynamic";

// 편집기는 첫 렌더에서 localStorage를 읽으므로 서버 렌더링 없이 브라우저에서만 그린다.
const PosterStudio = dynamic(() => import("@/components/PosterStudio"), { ssr: false });

export default function Page() {
  return <PosterStudio />;
}
