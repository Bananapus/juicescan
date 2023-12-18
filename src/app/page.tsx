"use client";

import { ConnectKitButton } from "@/components/ConnectKitButton";
import { formatDuration } from "date-fns";
import {
  DecayRate,
  RedemptionRate,
  ReservedRate,
  RulesetWeight,
} from "@/lib/juicebox/datatypes";
import {
  useJbControllerCurrentRulesetOf,
  useJbProjectsOwnerOf,
} from "@/lib/juicebox/hooks/contract";
import { FixedInt } from "fpnum";

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

  const { data: ruleset } = useJbControllerCurrentRulesetOf({
    args: [projectId],
    select([ruleset, metadata]) {
      return {
        data: {
          ...ruleset,
          weight: new RulesetWeight(ruleset.weight),
          decayRate: new DecayRate(ruleset.decayRate),
        },
        metadata: {
          ...metadata,
          redemptionRate: new RedemptionRate(metadata.redemptionRate),
          reservedRate: new ReservedRate(metadata.reservedRate),
        },
      };
    },
  });

  return {
    owner,
    ruleset,
  };
}

export function Page() {
  const { owner, ruleset } = useProject(2n);

  return (
    <main className="container mx-auto px-4">
      <nav className="flex justify-between py-4">
        <span>juice-v4</span> <ConnectKitButton />
      </nav>

      <h1 className="text-3xl font-bold mb-8">juice-v4</h1>

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

export default Page;
