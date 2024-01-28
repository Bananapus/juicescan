import { Button } from "@/components/ui/button";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useNativeTokenSymbol } from "../hooks/useNativeTokenSymbol";
import { useJBTerminalContext, useJbMultiTerminalPay } from "juice-sdk-react";
import { NATIVE_TOKEN } from "juice-sdk-core";

export function PayForm({ projectId }: { projectId: bigint }) {
  const { address: terminalAddress } = useJBTerminalContext();
  const nativeTokenSymbol = useNativeTokenSymbol();
  const { address } = useAccount();

  /**
   *    uint256 projectId,
        address token,
        uint256 amount,
        address beneficiary,
        uint256 minReturnedTokens,
        string calldata memo,
        bytes calldata metadata
   */
  const value = parseUnits("0.069", 18);

  const args = address
    ? [
        projectId,
        NATIVE_TOKEN,
        value,
        address,
        0n,
        "payed on juicescan.io",
        "0x0",
      ]
    : undefined;

  console.log("payargs", args);

  const { write } = useJbMultiTerminalPay({
    address: terminalAddress,
    args: address
      ? [
          projectId,
          NATIVE_TOKEN,
          value,
          address,
          0n,
          "payed on juicescan.io",
          "0x0",
        ]
      : undefined,
    value,
  });

  return (
    <div>
      <Button size="lg" className="w-full" onClick={() => write?.()}>
        Pay 0.069 {nativeTokenSymbol}
      </Button>
    </div>
  );
}
