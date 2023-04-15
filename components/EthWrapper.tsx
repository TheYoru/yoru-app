import { EthIcon } from "./EthIcon"

export const EthWrapper = (args) => {
  return (
    <>
      <EthIcon width="36px" height="36px" />
      <span>{args.value}</span>
      <span>ETH</span>
    </>
  );
};
