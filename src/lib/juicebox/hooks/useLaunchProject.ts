import { useJbControllerLaunchProjectFor } from "@/lib/juicebox/hooks/contract";
import { parseEther, zeroAddress } from "viem";
import { NATIVE_TOKEN, SPLITS_TOTAL_PERCENT } from "../datatypes";

export function useLaunchProject() {
  const x = useJbControllerLaunchProjectFor({
    args: [
      "0x0028C35095D34C9C8a3bc84cB8542cB182fcfa8e",
      "Qme7UdAovaq9N9SMtMKoTcAHazD7igPknVXojAQc244Jvi",
      [
        {
          mustStartAtOrAfter: 1n,
          duration: 60n * 60n * 24n, // 1 day
          weight: parseEther("1"),
          decayRate: 69_000_000n,
          approvalHook: zeroAddress,
          metadata: {
            reservedRate: 6_900n,
            redemptionRate: 4_200n,
            baseCurrency: 0n,
            pausePay: false,
            pauseCreditTransfers: false,
            allowOwnerMinting: false,
            allowTerminalMigration: false,
            allowSetTerminals: false,
            allowControllerMigration: false,
            allowSetController: false,
            holdFees: false,
            useTotalSurplusForRedemptions: false,
            useDataHookForPay: false,
            useDataHookForRedeem: false,
            dataHook: zeroAddress,
            metadata: 0n,
          },
          splitGroups: [
            {
              groupId: 1n,
              splits: [
                {
                  beneficiary: "0x0028C35095D34C9C8a3bc84cB8542cB182fcfa8e",
                  percent: 512300000n, // 51.23%
                  preferAddToBalance: false,
                  lockedUntil: 0n,
                  projectId: 0n,
                  hook: zeroAddress,
                },
              ],
            },
          ],
          fundAccessLimitGroups: [],
        },
      ],
      [
        {
          terminal: "0x4319cb152D46Db72857AfE368B19A4483c0Bff0D",
          tokensToAccept: [NATIVE_TOKEN],
        },
      ],
      "hi",
    ],
  });

  return x;
}
