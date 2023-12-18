"use client";

import { useJbProjectsOwnerOf } from "@/lib/juicebox/hooks/contract";

export function JuiceboxProjectOwner() {
  const { data: address } = useJbProjectsOwnerOf({
    args: [2n],
  });

  return (
    <div>
      JuiceboxDAO project owner:
      {address && <div>{address}</div>}
    </div>
  );
}
