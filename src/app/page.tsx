"use client";

import { ProjectsQuery, useProjectsQuery } from "@/generated/graphql";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import { useProjectMetadata } from "@/lib/juicebox/hooks/useProjectMetadata";
import { useJbDirectoryControllerOf } from "juice-sdk-react";
import Link from "next/link";

function ProjectRow({ project }: { project: ProjectsQuery["projects"][0] }) {
  const projectId = BigInt(project.projectId);
  const { data: jbControllerAddress } = useJbDirectoryControllerOf({
    args: [BigInt(projectId)],
  });
  const { data: metadata } = useProjectMetadata({
    projectId,
    jbControllerAddress,
  });
  console.log(metadata);
  return (
    <div className="border-t border-zinc-800 py-2 px-4 text-sm">
      <div>
        <Link
          href={`/p/${project.projectId}`}
          className="hover:underline hover:text-blue-400"
        >
          {project.projectId} {metadata?.name ?? "Untitled project"}
        </Link>
      </div>
    </div>
  );
}

function Page() {
  const { write } = useLaunchProject();
  const projects = useProjectsQuery();

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-4xl mb-6">juicescan</h1>

      <div className="border border-zinc-800 rounded-md">
        <div className="py-2 px-4 bg-zinc-900 flex justify-between">
          <div>Projects</div>
          <div>
            <button className="underline" onClick={() => write?.()}>
              Launch random project
            </button>
          </div>
        </div>
        {projects.data?.projects?.map((project) => (
          <ProjectRow project={project} key={project.projectId} />
        ))}
      </div>
    </main>
  );
}

export default Page;
