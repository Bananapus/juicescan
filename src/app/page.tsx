"use client";

import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";

export function Page() {
  const { write } = useLaunchProject();

  return (
    <main className="container mx-auto px-4">
      <h1>juice-v4</h1>
      <button onClick={() => write?.()}>Launch random project</button>
    </main>
  );
}

export default Page;
