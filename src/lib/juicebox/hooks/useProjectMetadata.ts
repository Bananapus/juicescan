import { getProjectMetadata } from "juice-sdk-core";
import { useQuery } from "react-query";
import { Address } from "viem";
import { useChainId, usePublicClient } from "wagmi";

export function useProjectMetadata({
  projectId,
  jbControllerAddress,
}: {
  projectId: bigint | undefined;
  jbControllerAddress: Address | undefined;
}) {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });

  console.log(chainId, publicClient, projectId, jbControllerAddress);

  return useQuery([projectId?.toString(), jbControllerAddress], async () => {
    if (!projectId || !jbControllerAddress) return null;

    const response = await getProjectMetadata(
      publicClient,
      {
        projectId,
        jbControllerAddress,
      },
      {
        ipfsGatewayHostname: "jbm.infura-ipfs.io",
      }
    );

    return response;
  });
}
