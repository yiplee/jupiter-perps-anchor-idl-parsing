import { PublicKey } from "@solana/web3.js";
import {
  JUPITER_PERPETUALS_PROGRAM,
  RATE_POWER,
  USDC_DECIMALS,
} from "../constants";
import { BNToUSDRepresentation } from "../utils";

// This function fetches the outstanding borrow fees for a position with the given public key
export async function getBorrowFee(positionPubkey: PublicKey) {
  const position =
    await JUPITER_PERPETUALS_PROGRAM.account.position.fetch(positionPubkey);

  const custody = await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(
    position.custody,
  );

  const fundingRate = custody.fundingRateState.cumulativeInterestRate.sub(
    position.cumulativeInterestSnapshot,
  );

  console.log(
    "Outstanding borrow fee ($): ",
    BNToUSDRepresentation(
      fundingRate.mul(position.sizeUsd).div(RATE_POWER),
      USDC_DECIMALS,
    ),
  );
}
