"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import { Button } from "@/components/ui/button";
import {
  DecayRate,
  NATIVE_TOKEN,
  RedemptionRate,
  ReservedRate,
  RulesetWeight,
} from "@/lib/juicebox/datatypes";
import {
  jbControllerABI,
  useJbControllerCurrentRulesetOf,
  useJbControllerMetadataOf,
  useJbDirectoryPrimaryTerminalOf,
  useJbMultiTerminalCurrentSurplusOf,
  useJbProjectsOwnerOf,
} from "@/lib/juicebox/hooks/contract";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import axios from "axios";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { formatUnits } from "viem";
import { sepolia, useNetwork } from "wagmi";
import { ReadContractResult } from "wagmi/dist/actions";

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

function ProjectPage({ projectId }: { projectId: bigint }) {
  const { owner, ruleset, projectMetadata, surplus } = useProject(projectId);
  const { write } = useLaunchProject();
  const nativeTokenSymbol = useNativeTokenSymbol();

  const boolProps: Array<
    keyof ReadContractResult<typeof jbControllerABI, "currentRulesetOf">[1]
  > = [
    "pausePay",
    "pauseCreditTransfers",
    "allowOwnerMinting",
    "allowTerminalMigration",
    "allowSetTerminals",
    "allowControllerMigration",
    "allowSetController",
    "holdFees",
    "useTotalSurplusForRedemptions",
    "useDataHookForPay",
    "useDataHookForRedeem",
  ];

  return (
    <main className="container mx-auto px-4">
      <nav className="flex justify-between py-4">
        <div>
          <span>juice-v4</span>
          <Button variant="link" onClick={() => write?.()}>
            One-click launch
          </Button>
        </div>
        <ConnectKitButton />
      </nav>

      <h1 className="text-3xl font-bold mb-8">{projectMetadata?.name}</h1>

      <h2 className="font-bold mb-2">Treasury</h2>
      <dl className="divide-y divide-gray-100 mb-12">
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Surplus</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {typeof surplus !== "undefined" ? formatUnits(surplus, 18) : null}{" "}
            {nativeTokenSymbol}
          </dd>
        </div>
      </dl>

      <h2 className="font-bold mb-2">Ruleset</h2>

      <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Duration</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {formatSeconds(Number(ruleset?.data.duration ?? 0))}
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Weight</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {ruleset?.data.weight.val.toString()}
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Decay rate</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {ruleset?.data.decayRate.format()}%
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Redemption rate</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {ruleset?.metadata.redemptionRate.formatPercentage()}%
          </dd>
        </div>
        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium leading-6">Reserved rate</dt>
          <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
            {ruleset?.metadata.reservedRate.formatPercentage()}%
          </dd>
        </div>
        {boolProps.map((prop) => (
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4" key={prop}>
            <dt className="text-sm font-medium leading-6">{prop}</dt>
            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
              {ruleset?.metadata[prop] ? "true" : "false"}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

function Page({ params }: { params: { projectId: string } }) {
  const queryClient = new QueryClient();
  const projectId = BigInt(params.projectId);

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectPage projectId={projectId} />
    </QueryClientProvider>
  );
}

export default Page;
