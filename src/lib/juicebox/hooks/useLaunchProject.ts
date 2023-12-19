import { NATIVE_TOKEN } from "@/app/p/[projectId]/page";
import { useJbControllerLaunchProjectFor } from "@/lib/juicebox/hooks/contract";
import { parseEther, zeroAddress } from "viem";

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
          splitGroups: [],
          fundAccessLimitGroups: [],
        },
      ],
      [
        {
          terminal: "0xa731EE2C4A8B513a481b6a916209aC8Ac64cab8F",
          tokensToAccept: [NATIVE_TOKEN],
        },
      ],
      "hi",
    ],
  });

  return x;
}
