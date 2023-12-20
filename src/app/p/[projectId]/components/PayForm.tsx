import { Button } from "@/components/ui/button";
import { NATIVE_TOKEN } from "@/lib/juicebox/datatypes";
import { useJbMultiTerminalPay } from "@/lib/juicebox/hooks/contract";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useNativeTokenSymbol } from "../hooks/useNativeTokenSymbol";

export function PayForm({ projectId }: { projectId: bigint }) {
  const nativeTokenSymbol = useNativeTokenSymbol();
  const { address } = useAccount();

  /**
   *      uint256 projectId,
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
        "payed on jbv4.vercel.app",
        "0x0",
      ]
    : undefined;

  console.log("payargs", args);

  const { write } = useJbMultiTerminalPay({
    // address: todo
    args: address
      ? [
          projectId,
          NATIVE_TOKEN,
          value,
          address,
          0n,
          "payed on jbv4.vercel.app",
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
