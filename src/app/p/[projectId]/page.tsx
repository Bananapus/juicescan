"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import EtherscanLink from "@/components/EtherscanLink";
import { Button } from "@/components/ui/button";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import { useProjectMetadata } from "@/lib/juicebox/hooks/useProjectMetadata";
import { NATIVE_TOKEN, SplitPortion } from "juice-sdk-core";
import {
  JBProjectProvider,
  JBTerminalProvider,
  jbControllerABI,
  useJBContractContext,
  useJBRuleset,
  useJBRulesetMetadata,
  useJBTerminalContext,
  useJbControllerPendingReservedTokenBalanceOf,
  useJbMultiTerminalCurrentSurplusOf,
  useJbProjectsOwnerOf,
  useJbSplitsSplitsOf,
  useJbTerminalStoreBalanceOf,
} from "juice-sdk-react";
import Link from "next/link";
import { formatUnits } from "viem";
import { ReadContractResult } from "wagmi/dist/actions";
import { PayForm } from "./components/PayForm";
import { useNativeTokenSymbol } from "./hooks/useNativeTokenSymbol";
import Image from "next/image";

const RESERVED_TOKEN_SPLIT_GROUP_ID = 1n;
const PAYOUT_SPLIT_GROUP_ID = 2n;

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

function Balance({ projectId }: { projectId: bigint }) {
  const { store, address } = useJBTerminalContext();
  const { data: balance } = useJbTerminalStoreBalanceOf({
    address: store?.data ?? undefined,
    args: address ? [address, projectId, NATIVE_TOKEN] : undefined,
  });
  const nativeTokenSymbol = useNativeTokenSymbol();

  return (
    <>
      {typeof balance !== "undefined" ? formatUnits(balance, 18) : null}{" "}
      {nativeTokenSymbol}
    </>
  );
}

function useProject(projectId: bigint) {
  const { contracts } = useJBContractContext();

  const ruleset = useJBRuleset();
  const rulesetMetadata = useJBRulesetMetadata();
  const { data: primaryNativeTerminalAddress } =
    contracts.primaryNativeTerminal;

  const { data: surplus } = useJbMultiTerminalCurrentSurplusOf({
    address: primaryNativeTerminalAddress ?? undefined,
    args: [projectId, 18n, BigInt(NATIVE_TOKEN)],
  });
  const { data: owner } = useJbProjectsOwnerOf({
    args: [projectId],
  });

  const { data: pendingReservedTokens } =
    useJbControllerPendingReservedTokenBalanceOf({
      address: contracts.controller.data ?? undefined,
      args: [projectId],
    });

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

  const { data: payoutSplits } = useJbSplitsSplitsOf({
    args: ruleset?.data
      ? [projectId, ruleset?.data.id, PAYOUT_SPLIT_GROUP_ID]
      : undefined,
    select(splits) {
      return splits.map((split) => ({
        ...split,
        percent: new SplitPortion(split.percent),
      }));
    },
  });

  const { data: projectMetadata } = useProjectMetadata({
    projectId,
    jbControllerAddress: contracts.controller.data ?? undefined,
  });

  return {
    payoutSplits,
    pendingReservedTokens,
    reservedTokenSplits,
    surplus,
    projectMetadata,
    owner,
    ruleset,
    rulesetMetadata,
    primaryNativeTerminalAddress,
  };
}

function ProjectPage({ projectId }: { projectId: bigint }) {
  const {
    pendingReservedTokens,
    owner,
    ruleset,
    projectMetadata,
    rulesetMetadata,
    surplus,
    reservedTokenSplits,
    primaryNativeTerminalAddress,
    payoutSplits,
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

  if (!primaryNativeTerminalAddress) return;

  return (
    <JBTerminalProvider address={primaryNativeTerminalAddress}>
      <main className="container mx-auto px-4">
        <nav className="flex justify-between py-4">
          <div>
            <Link href="/">juicescan.io</Link>
            <Button variant="link" onClick={() => write?.()}>
              One-click launch
            </Button>
          </div>
          <ConnectKitButton />
        </nav>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{projectMetadata?.name}</h1>
          {owner ? (
            <span className="text-zinc-400 text-sm">
              Owned by{" "}
              <EtherscanLink value={owner} type="address">
                {owner}
              </EtherscanLink>
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-5 gap-16">
          <div className="col-span-3">
            <h2 className="font-bold mb-2">Treasury</h2>
            <dl className="divide-y divide-gray-100 mb-12">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Balance</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  <Balance projectId={projectId} />
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
                  {Number(rulesetMetadata?.data?.baseCurrency ?? -1)}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Duration</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {formatSeconds(Number(ruleset?.data?.duration ?? 0))}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Weight</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {ruleset?.data?.weight.format()} TOKEN / {nativeTokenSymbol}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Decay rate</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {ruleset?.data?.decayRate.format()}%
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Redemption rate
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetMetadata?.data?.redemptionRate.formatPercentage()}%
                </dd>
              </div>

              {boolProps.map((prop) => (
                <div
                  className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                  key={prop}
                >
                  <dt className="text-sm font-medium leading-6">{prop}</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                    {rulesetMetadata?.data?.[prop] ? "true" : "false"}
                  </dd>
                </div>
              ))}
            </dl>

            <h2 className="font-bold mb-2">Reserved tokens</h2>
            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Reserved rate</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetMetadata?.data?.reservedRate.formatPercentage()}%
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Tokens reserved
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {typeof pendingReservedTokens !== "undefined"
                    ? formatUnits(pendingReservedTokens, 18)
                    : null}
                </dd>
              </div>
            </dl>

            <h2 className="font-bold mb-2">Payouts</h2>
            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              {payoutSplits && payoutSplits.length > 0 ? (
                payoutSplits.map((split, idx) => (
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
                ))
              ) : (
                <div className="px-4 py-3 text-sm">No payouts</div>
              )}
            </dl>

            <h2 className="font-bold mb-2">Reserved token recipients</h2>
            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              {reservedTokenSplits && reservedTokenSplits.length > 0 ? (
                reservedTokenSplits.map((split, idx) => (
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
                ))
              ) : (
                <div className="px-4 py-3 text-sm">No payouts</div>
              )}
            </dl>
          </div>
          <div className="col-span-2">
            {/* card */}
            <div className="bg-zinc-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="font-bold mb-2">Pay {nativeTokenSymbol}</h2>

              <PayForm projectId={projectId} />
            </div>
          </div>
        </div>
      </main>
    </JBTerminalProvider>
  );
}

function Page({ params }: { params: { projectId: string } }) {
  const projectId = BigInt(params.projectId);

  return (
    <JBProjectProvider projectId={projectId}>
      <ProjectPage projectId={projectId} />
    </JBProjectProvider>
  );
}

export default Page;
