import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BPS_POWER, JUPITER_PERPETUALS_PROGRAM } from "../constants";

export async function getPriceImpactFee(
  tradeSizeUsd: BN,
  custodyPubkey: PublicKey,
) {
  const custody =
    await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(custodyPubkey);

  const priceImpactFeeBps = tradeSizeUsd
    .mul(BPS_POWER)
    .div(custody.pricing.tradeImpactFeeScalar);

  const priceImpactFeeUsd = tradeSizeUsd.mul(priceImpactFeeBps).div(BPS_POWER);

  console.log("Price impact fee ($): ", priceImpactFeeUsd);
}
