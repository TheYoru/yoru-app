import { UsdcIcon } from "./UsdcIcon"

export const UsdcWrapper = (args) => {
  return (
    <>
      <UsdcIcon width="36px" height="36px" />
      <span>{args.value}</span>
      <span>USDC</span>
    </>
  );
};
