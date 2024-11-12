import { BN } from "@coral-xyz/anchor";
import {
  BPS_POWER,
  JLP_POOL_ACCOUNT_PUBKEY,
  JUPITER_PERPETUALS_PROGRAM,
  USDC_DECIMALS,
} from "../constants";
import { BNToUSDRepresentation } from "../utils";

export async function getOpenCloseBaseFee(tradeSizeUsd: BN) {
  const pool = await JUPITER_PERPETUALS_PROGRAM.account.pool.fetch(
    JLP_POOL_ACCOUNT_PUBKEY,
  );

  const baseFeeBps = pool.fees.increasePositionBps;
  // Use `decreasePositionBps` for close position or withdraw collateral trades
  // const baseFeeBps = pool.fees.decreasePositionBps;

  const feeUsd = tradeSizeUsd.mul(baseFeeBps).div(BPS_POWER);

  console.log("Base fee ($): ", BNToUSDRepresentation(feeUsd, USDC_DECIMALS));
}
