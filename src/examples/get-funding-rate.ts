import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BPS_POWER, JUPITER_PERPETUALS_PROGRAM } from "../constants";

export async function getFundingRate(custodyPubkey: PublicKey) {
  const custody =
    await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(custodyPubkey);

  const utilizationPctBn =
    custody.assets.owned.gtn(0) && custody.assets.locked.gtn(0)
      ? custody.assets.locked.muln(BPS_POWER).div(custody.assets.owned)
      : new BN(0);
  const utilizationPct = utilizationPctBn.toNumber() / BPS_POWER.toNumber();
  const hourlyFundingDbps =
    custody.fundingRateState.hourlyFundingDbps.toNumber() /
    (BPS_POWER.toNumber() / 10);

  // Show borrow rate to 4 decimal places
  const fundingRatePercent = (hourlyFundingDbps * utilizationPct).toFixed(4);

  console.log("Funding rate (%): ,", fundingRatePercent);
}
