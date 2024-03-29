"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import EtherscanLink from "@/components/EtherscanLink";
import { Button } from "@/components/ui/button";
import { useLaunchProject } from "@/lib/juicebox/hooks/useLaunchProject";
import { useProjectMetadata } from "@/lib/juicebox/hooks/useProjectMetadata";
import {
  DecayRate,
  Ether,
  NATIVE_CURRENCY,
  NATIVE_TOKEN,
  RedemptionRate,
  ReservedRate,
  RulesetWeight,
  SplitPortion,
} from "juice-sdk-core";
import {
  JBProjectProvider,
  JBTerminalProvider,
  jbControllerABI,
  useJBContractContext,
  useJBRuleset,
  useJBRulesetMetadata,
  useJBTerminalContext,
  useJbControllerCurrentRulesetOf,
  useJbControllerPendingReservedTokenBalanceOf,
  useJbFundAccessLimitsPayoutLimitOf,
  useJbFundAccessLimitsSurplusAllowanceOf,
  useJbMultiTerminalCurrentSurplusOf,
  useJbProjectsOwnerOf,
  useJbSplitsSplitsOf,
  useJbTerminalStoreBalanceOf,
  useJbTerminalStoreUsedPayoutLimitOf,
  useJbTerminalStoreUsedSurplusAllowanceOf,
  useJbTokensTokenOf,
} from "juice-sdk-react";
import Link from "next/link";
import { useState } from "react";
import { formatUnits } from "viem";
import { useToken } from "wagmi";
import { ReadContractResult } from "wagmi/dist/actions";
import { PayForm } from "./components/PayForm";
import { useNativeTokenSymbol } from "./hooks/useNativeTokenSymbol";

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

  const { data: projectMetadata } = useProjectMetadata({
    projectId,
    jbControllerAddress: contracts.controller.data ?? undefined,
  });

  const { data: surplusAllowance } = useJbFundAccessLimitsSurplusAllowanceOf({
    address: contracts.fundAccessLimits.data ?? undefined,
    args:
      ruleset.data && contracts.primaryNativeTerminal.data
        ? [
            projectId,
            ruleset.data?.id,
            contracts.primaryNativeTerminal.data,
            NATIVE_TOKEN,
            NATIVE_CURRENCY,
          ]
        : undefined,
    select(data) {
      return new Ether(data);
    },
  });

  const { data: tokenAddress } = useJbTokensTokenOf({ args: [projectId] });
  const token = useToken({ address: tokenAddress ?? undefined });

  const { data: queuedRuleset, isLoading: queuedRulesetIsLoading } =
    useJbControllerCurrentRulesetOf({
      address: contracts?.controller?.data ?? undefined,
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

  const { store } = useJBTerminalContext();

  const { data: usedSurplus } = useJbTerminalStoreUsedSurplusAllowanceOf({
    address: store.data ?? undefined,
    args:
      contracts.primaryNativeTerminal?.data && ruleset.data?.id
        ? [
            contracts.primaryNativeTerminal.data,
            projectId,
            NATIVE_TOKEN,
            ruleset.data?.id,
            NATIVE_CURRENCY,
          ]
        : undefined,
  });

  return {
    token,
    surplusAllowance,
    pendingReservedTokens,
    surplus,
    usedSurplus,
    projectMetadata,
    owner,
    ruleset,
    rulesetMetadata,
    queuedRuleset: {
      data: queuedRuleset?.data,
      isLoading: queuedRulesetIsLoading,
    },
    queuedRulesetMetadata: {
      data: queuedRuleset?.metadata,
      isLoading: queuedRulesetIsLoading,
    },
    primaryNativeTerminalAddress,
  };
}

function ProjectPage({ projectId }: { projectId: bigint }) {
  const {
    pendingReservedTokens,
    owner,
    ruleset,
    rulesetMetadata,
    queuedRuleset,
    queuedRulesetMetadata,
    projectMetadata,
    usedSurplus,
    surplus,
    primaryNativeTerminalAddress,
    surplusAllowance,
    token,
  } = useProject(projectId);
  const { contracts } = useJBContractContext();
  const { store } = useJBTerminalContext();

  const { write } = useLaunchProject();
  const nativeTokenSymbol = useNativeTokenSymbol();

  const [rulesetToRenderToggle, setRulesetToRenderToggle] = useState<
    "current" | "nextQueued"
  >("current");

  const rulesetToRender =
    rulesetToRenderToggle === "current" ? ruleset : queuedRuleset;
  const rulesetMetadataToRender =
    rulesetToRenderToggle === "current"
      ? rulesetMetadata
      : queuedRulesetMetadata;

  const { data: payoutLimit } = useJbFundAccessLimitsPayoutLimitOf({
    address: contracts.fundAccessLimits.data ?? undefined,
    args:
      rulesetToRender?.data && contracts.primaryNativeTerminal?.data
        ? [
            projectId,
            rulesetToRender?.data?.id,
            contracts.primaryNativeTerminal.data,
            NATIVE_TOKEN,
            NATIVE_CURRENCY,
          ]
        : undefined,
  });

  console.log('payoutLimit', payoutLimit)

  const { data: usedPayoutLimit } = useJbTerminalStoreUsedPayoutLimitOf({
    address: store.data ?? undefined,
    args:
      rulesetToRender?.data && contracts.primaryNativeTerminal?.data
        ? [
            contracts.primaryNativeTerminal.data,
            projectId,
            NATIVE_TOKEN,
            rulesetToRender?.data?.cycleNumber,
            NATIVE_CURRENCY,
          ]
        : undefined,
  });

  const { data: reservedTokenSplits } = useJbSplitsSplitsOf({
    args: rulesetToRender?.data
      ? [projectId, rulesetToRender?.data.id, RESERVED_TOKEN_SPLIT_GROUP_ID]
      : undefined,
    select(splits) {
      return splits.map((split) => ({
        ...split,
        percent: new SplitPortion(split.percent),
      }));
    },
  });

  const { data: payoutSplits } = useJbSplitsSplitsOf({
    args: rulesetToRender?.data
      ? [projectId, rulesetToRender?.data.id, PAYOUT_SPLIT_GROUP_ID]
      : undefined,
    select(splits) {
      return splits.map((split) => ({
        ...split,
        percent: new SplitPortion(split.percent),
      }));
    },
  });

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
            <div className="text-zinc-400 text-sm">
              Owned by{" "}
              <EtherscanLink value={owner} type="address">
                {owner}
              </EtherscanLink>
            </div>
          ) : null}
          {token?.data ? (
            <div className="text-zinc-400 text-sm">
              <EtherscanLink value={token.data.address} type="address">
                {token.data.name} (${token.data.symbol})
              </EtherscanLink>
            </div>
          ) : (
            <div className="text-zinc-400 text-sm">No ERC-20 token</div>
          )}
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
                  <span>
                    {typeof surplus !== "undefined"
                      ? formatUnits(surplus, 18)
                      : null}{" "}
                    {nativeTokenSymbol}
                  </span>
                  {usedSurplus ? (
                    <span>
                      {" "}
                      (used {formatUnits(usedSurplus, 18)} {nativeTokenSymbol})
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>

            <h2 className="font-bold mb-2">Metadata</h2>

            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              {projectMetadata
                ? (
                    Object.keys(
                      projectMetadata
                    ) as (keyof typeof projectMetadata)[]
                  ).map((key) => (
                    <div
                      className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                      key={key}
                    >
                      <dt className="text-sm font-medium leading-6">{key}</dt>
                      <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right overflow-auto">
                        {projectMetadata[key]}
                      </dd>
                    </div>
                  ))
                : null}
            </dl>

            <div className="flex items-center mb-2 justify-between">
              <h2 className="font-bold">Ruleset</h2>
              <div className="text-sm">
                <Button
                  variant="link"
                  onClick={() => setRulesetToRenderToggle("current")}
                  size="sm"
                  className={
                    rulesetToRenderToggle === "current" ? "underline" : ""
                  }
                >
                  Current
                </Button>
                <Button
                  variant="link"
                  onClick={() => setRulesetToRenderToggle("nextQueued")}
                  size="sm"
                  className={
                    rulesetToRenderToggle === "nextQueued" ? "underline" : ""
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Base currency</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {Number(rulesetMetadataToRender?.data?.baseCurrency ?? -1)}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Duration</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {formatSeconds(Number(rulesetToRender?.data?.duration ?? 0))}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Weight</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetToRender?.data?.weight.format()}{" "}
                  {token.data?.symbol ?? "TOKEN"} / {nativeTokenSymbol}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Decay rate</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetToRender?.data?.decayRate.format()}%
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Redemption rate
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetMetadataToRender?.data?.redemptionRate.formatPercentage()}
                  %
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Ruleset approval hook
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetToRender.data?.approvalHook ? (
                    <EtherscanLink
                      value={rulesetToRender.data?.approvalHook}
                      type="address"
                    />
                  ) : (
                    <span>None</span>
                  )}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Surplus Allowance
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {surplusAllowance?.format()} {nativeTokenSymbol}
                </dd>
              </div>

              {boolProps.map((prop) => (
                <div
                  className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
                  key={prop}
                >
                  <dt className="text-sm font-medium leading-6">{prop}</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                    {rulesetMetadataToRender?.data?.[prop] ? "true" : "false"}
                  </dd>
                </div>
              ))}
            </dl>

            <h2 className="font-bold mb-2">Reserved tokens</h2>
            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Reserved rate</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {rulesetMetadataToRender?.data?.reservedRate.formatPercentage()}
                  %
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
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Payout limit</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  <span>
                    {payoutLimit ? formatUnits(payoutLimit, 18) : 0}{" "}
                    {nativeTokenSymbol}
                  </span>
                  {usedPayoutLimit ? (
                    <span>
                      {" "}
                      (used {formatUnits(usedPayoutLimit, 18)}{" "}
                      {nativeTokenSymbol})
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
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

            <h2 className="font-bold mb-2">Project contracts</h2>
            <dl className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg mb-10">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Terminal</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {contracts.primaryNativeTerminal.data ? (
                    <EtherscanLink
                      value={contracts.primaryNativeTerminal.data}
                      type="address"
                    />
                  ) : null}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">Controller</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {contracts.controller.data ? (
                    <EtherscanLink
                      value={contracts.controller.data}
                      type="address"
                    />
                  ) : null}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6">
                  Fund Access Limits
                </dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0 text-right">
                  {contracts.fundAccessLimits.data ? (
                    <EtherscanLink
                      value={contracts.fundAccessLimits.data}
                      type="address"
                    />
                  ) : null}
                </dd>
              </div>
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
