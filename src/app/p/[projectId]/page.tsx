"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import { Button } from "@/components/ui/button";
import {
  DecayRate,
  NATIVE_TOKEN,
  RedemptionRate,
  ReservedRate,
  RulesetWeight,
  SplitPortion,
} from "@/lib/juicebox/datatypes";
import {
  jbControllerABI,
  useJbControllerCurrentRulesetOf,
  useJbControllerMetadataOf,
  useJbControllerPendingReservedTokenBalanceOf,
  useJbDirectoryPrimaryTerminalOf,
  useJbMultiTerminalCurrentSurplusOf,
  useJbMultiTerminalStore,
  useJbProjectsOwnerOf,
  useJbSplitsSplitsOf,
  useJbTerminalStoreBalanceOf,
} from "@/lib/juicebox/hooks/contract";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import axios from "axios";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { formatUnits } from "viem";
import { ReadContractResult } from "wagmi/dist/actions";
import { PayForm } from "./components/PayForm";
import { useNativeTokenSymbol } from "./hooks/useNativeTokenSymbol";

const RESERVED_TOKEN_SPLIT_GROUP_ID = 1n;

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

  const parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  }

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }

  if (seconds > 0) {
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  }

  return parts.join(", ");
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

  const { data: terminalStore } = useJbMultiTerminalStore({
    address: primaryTerminalAddress,
  });

  const { data: balance } = useJbTerminalStoreBalanceOf({
    address: terminalStore,
    args: primaryTerminalAddress
      ? [primaryTerminalAddress, projectId, NATIVE_TOKEN]
      : undefined,
  });

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

  const { data: pendingReservedTokens } =
    useJbControllerPendingReservedTokenBalanceOf({ args: [projectId] });

  const { data: reservedTokenSplits } = useJbSplitsSplitsOf({
    args: ruleset?.data
      ? [projectId, ruleset?.data.id, RESERVED_TOKEN_SPLIT_GROUP_ID]
      : undefined,
    select(splits) {
      return splits.map((split) => ({
        ...split,
        percent: new SplitPortion(split.percent),
      }));
    },
  });

  console.log(reservedTokenSplits);

  const { data: projectMetadata } = useQuery(
    ["metadata", metadataCid],
    async () => {
      const { data } = await axios.get(
        `https://jbm.infura-ipfs.io/ipfs/${metadataCid}`
      );
      return data;
    }
  );

  return {
    pendingReservedTokens,
    reservedTokenSplits,
    balance,
    surplus,
    projectMetadata,
    owner,
    ruleset,
  };
}

function ProjectPage({ projectId }: { projectId: bigint }) {
  const {
    pendingReservedTokens,
    owner,
    ruleset,
    projectMetadata,
    surplus,
    balance,
    reservedTokenSplits,
  } = useProject(projectId);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">{projectMetadata?.name}</h1>
        <span className="text-zinc-400 text-sm">Owned by {owner}</span>
      </div>

      <div className="grid grid-cols-5 gap-16">
        <div className="col-span-3">
          <h2 className="font-bold mb-2">Treasury</h2>
          <dl className="divide-y divide-gray-100 mb-12">
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Balance</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {typeof balance !== "undefined"
                  ? formatUnits(balance, 18)
                  : null}{" "}
                {nativeTokenSymbol}
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Surplus</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {typeof surplus !== "undefined"
                  ? formatUnits(surplus, 18)
                  : null}{" "}
                {nativeTokenSymbol}
              </dd>
            </div>
          </dl>

          <h2 className="font-bold mb-2">Ruleset</h2>

          <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Base currency</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {Number(ruleset?.metadata.baseCurrency ?? -1)}
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Duration</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {formatSeconds(Number(ruleset?.data.duration ?? 0))}
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Weight</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {ruleset?.data.weight.val.toString()}
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Decay rate</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {ruleset?.data.decayRate.format()}%
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Redemption rate</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {ruleset?.metadata.redemptionRate.formatPercentage()}%
              </dd>
            </div>

            {boolProps.map((prop) => (
              <div
                className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                key={prop}
              >
                <dt className="text-sm font-medium leading-6">{prop}</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {ruleset?.metadata[prop] ? "true" : "false"}
                </dd>
              </div>
            ))}
          </dl>

          <h2 className="font-bold mb-2">Reserved tokens</h2>
          <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Reserved rate</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {ruleset?.metadata.reservedRate.formatPercentage()}%
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6">Tokens reserved</dt>
              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                {typeof pendingReservedTokens !== "undefined"
                  ? formatUnits(pendingReservedTokens, 18)
                  : null}
              </dd>
            </div>
          </dl>
          <h3>Reserved list</h3>
          <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
            {reservedTokenSplits?.map((split, idx) => (
              <div
                className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                key={idx}
              >
                <dt className="text-sm font-medium leading-6">
                  {split.beneficiary}
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {split.percent.formatPercentage()}%
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="col-span-2">
          {/* card */}
          <div className="bg-zinc-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="font-bold mb-2">Pay</h2>
            <PayForm projectId={projectId} />
          </div>
        </div>
      </div>
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
