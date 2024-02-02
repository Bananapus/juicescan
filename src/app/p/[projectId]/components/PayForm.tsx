import { Button } from "@/components/ui/button";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useNativeTokenSymbol } from "../hooks/useNativeTokenSymbol";
import { useJBTerminalContext, useJbMultiTerminalPay } from "juice-sdk-react";
import { NATIVE_TOKEN } from "juice-sdk-core";
import DecimalsInput from "@/components/ui/decimalsInput";
import { useState } from "react";

export function PayForm({ projectId }: { projectId: bigint }) {
  const [value, setValue] = useState("0");

  const { address: terminalAddress } = useJBTerminalContext();
  const nativeTokenSymbol = useNativeTokenSymbol();
  const { address } = useAccount();
  
  const decimals = 18;

  /**
   *    uint256 projectId,
        address token,
        uint256 amount,
        address beneficiary,
        uint256 minReturnedTokens,
        string calldata memo,
        bytes calldata metadata
   */

  const args = address
    ? [
        projectId,
        NATIVE_TOKEN,
        value ? parseUnits(value, decimals) : 0n,
        address,
        0n,
        "paid on juicescan.io",
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
          value ? parseUnits(value, decimals) : 0n,
          address,
          0n,
          "paid on juicescan.io",
          "0x0",
        ]
      : undefined,
    value: value ? parseUnits(value, decimals) : 0n,
  });

  return (
    <div className="flex flex-col gap-2">
      <DecimalsInput value={value} onChange={setValue} size="lg"/>
      <Button size="lg" className="w-full" onClick={() => write?.()}>
        Pay {value ? value : "0"} {nativeTokenSymbol}
      </Button>
    </div>
  );
}
