import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chain, mainnet } from "wagmi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function etherscanLink(
  addressOrTxHash: string,
  opts: {
    type: "address" | "tx";
    chain?: Chain;
  }
) {
  const { type, chain = mainnet } = opts;

  const baseUrl = `https://${
    chain.id === mainnet.id ? "" : `${chain.name}.`
  }etherscan.io`;

  switch (type) {
    case "address":
      return `${baseUrl}/address/${addressOrTxHash}`;
    case "tx":
      return `${baseUrl}/tx/${addressOrTxHash}`;
  }
}

export function formatEthAddress(
  address: string,
  opts: {
    truncateTo?: number;
  } = {
    truncateTo: 4,
  }
) {
  if (!opts.truncateTo) return address;

  const frontTruncate = opts.truncateTo + 2; // account for 0x
  return (
    address.substring(0, frontTruncate) +
    "..." +
    address.substring(address.length - opts.truncateTo, address.length)
  );
}
