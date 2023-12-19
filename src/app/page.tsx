"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import {
  DecayRate,
  RedemptionRate,
  ReservedRate,
  RulesetWeight,
} from "@/lib/juicebox/datatypes";
import {
  useJbControllerCurrentRulesetOf,
  useJbControllerMetadataOf,
  useJbDirectoryPrimaryTerminalOf,
  useJbMultiTerminalCurrentSurplusOf,
  useJbProjectsBalanceOf,
  useJbProjectsOwnerOf,
} from "@/lib/juicebox/hooks/contract";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import axios from "axios";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { formatUnits } from "viem";
import { sepolia, useAccount, useNetwork } from "wagmi";

export const NATIVE_TOKEN = "0x000000000000000000000000000000000000EEEe";

function useNativeTokenSymbol() {
  const symbols: { [k: number]: string } = { [sepolia.id]: "SepoliaETH" };

  const { chain } = useNetwork();
  return symbols[chain?.id ?? 0] ?? "ETH";
}

function formatSeconds(totalSeconds: number) {
  const secondsPerDay = 86400;
  const secondsPerHour = 3600;
  const secondsPerMinute = 60;

  const days = Math.floor(totalSeconds / secondsPerDay);
  const hours = Math.floor((totalSeconds % secondsPerDay) / secondsPerHour);
  const minutes = Math.floor(
    (totalSeconds % secondsPerHour) / secondsPerMinute
  );
  const seconds = totalSeconds % secondsPerMinute;

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

function useProject(projectId: bigint) {
  const { data: owner } = useJbProjectsOwnerOf({
    args: [projectId],
  });
  const { data: metadataCid } = useJbControllerMetadataOf({
    args: [projectId],
  });
  const { data: primaryTerminalAddress } = useJbDirectoryPrimaryTerminalOf({
    args: [projectId, NATIVE_TOKEN],
  });

  const { data: surplus } = useJbMultiTerminalCurrentSurplusOf({
    address: primaryTerminalAddress,
    args: [projectId, 18n, 0n],
  });

  const { data: projectMetadata } = useQuery(
    ["metadata", metadataCid],
    async () => {
      const { data } = await axios.get(
        `https://jbm.infura-ipfs.io/ipfs/${metadataCid}`
      );
      return data;
    }
  );

  const { data: ruleset } = useJbControllerCurrentRulesetOf({
    args: [projectId],
    select([ruleset, rulesetMetadata]) {
      return {
        data: {
          ...ruleset,
          weight: new RulesetWeight(ruleset.weight),
          decayRate: new DecayRate(ruleset.decayRate),
        },
        metadata: {
          ...rulesetMetadata,
          redemptionRate: new RedemptionRate(rulesetMetadata.redemptionRate),
          reservedRate: new ReservedRate(rulesetMetadata.reservedRate),
        },
      };
    },
  });

  return {
    surplus,
    projectMetadata,
    owner,
    ruleset,
  };
}

function ProjectPage() {
  const { owner, ruleset, projectMetadata, surplus } = useProject(1n);
  const { write } = useLaunchProject();
  const nativeTokenSymbol = useNativeTokenSymbol();

  return (
    <main className="container mx-auto px-4">
      <nav className="flex justify-between py-4">
        <span>juice-v4</span> <ConnectKitButton />
      </nav>

      <h1 className="text-3xl font-bold mb-8">{projectMetadata?.name}</h1>

      <button onClick={() => write?.()}>Launch random project</button>

      <h2 className="font-bold mb-2">Treasury</h2>
      <dl className="divide-y divide-gray-100 mb-12">
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Surplus
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {typeof surplus !== "undefined" ? formatUnits(surplus, 18) : null}{" "}
            {nativeTokenSymbol}
          </dd>
        </div>
      </dl>

      <h2 className="font-bold mb-2">Ruleset</h2>
      <dl className="divide-y divide-gray-100">
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Duration
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {formatSeconds(Number(ruleset?.data.duration ?? 0))}
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Weight
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {ruleset?.data.weight.val.toString()}
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Decay rate
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {ruleset?.data.decayRate.format()}%
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Redemption rate
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {ruleset?.metadata.redemptionRate.formatPercentage()}%
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="text-sm font-medium leading-6 text-gray-900">
            Reserved rate
          </dt>
          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {ruleset?.metadata.reservedRate.formatPercentage()}%
          </dd>
        </div>
      </dl>
    </main>
  );
}

export function Page() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectPage />
    </QueryClientProvider>
  );
}

export default Page;
