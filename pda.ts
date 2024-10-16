import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const JUPITER_PERPS_PROGRAM_ID = new PublicKey(
  "PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu",
);
const JUPITER_PERPS_POOL_ADDRESS = new PublicKey(
  "5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq",
);

export function generatePositionRequestPda({
  counter,
  positionPubkey,
  requestChange,
}: {
  counter?: BN;
  positionPubkey: PublicKey;
  requestChange: "increase" | "decrease";
}) {
  // The `counter` constant acts a random seed so we can generate a unique PDA every time the user
  // creates a position request
  if (!counter) {
    counter = new BN(Math.floor(Math.random() * 1_000_000_000));
  }

  const requestChangeEnum = requestChange === "increase" ? [1] : [2];

  // The `positionRequest` PDA holds the requests for all the perpetuals actions. Once the `positionRequest`
  // is submitted on chain, the keeper(s) will pick them up and execute the requests (hence the request
  // fulfillment model)
  const [positionRequest, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_request"),
      new PublicKey(positionPubkey).toBuffer(),
      counter.toArrayLike(Buffer, "le", 8),
      Buffer.from(requestChangeEnum),
    ],
    JUPITER_PERPS_PROGRAM_ID,
  );

  return { positionRequest, counter, bump };
}

export function generatePositionPda({
  custody,
  collateralCustody,
  walletAddress,
  side,
}: {
  custody: PublicKey;
  collateralCustody: PublicKey;
  walletAddress: PublicKey;
  side: "long" | "short";
}) {
  const [position, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position"),
      walletAddress.toBuffer(),
      JUPITER_PERPS_POOL_ADDRESS.toBuffer(),
      custody.toBuffer(),
      collateralCustody.toBuffer(),
      // @ts-ignore
      side === "long" ? [1] : [2],
    ],
    JUPITER_PERPS_PROGRAM_ID,
  );

  return { position, bump };
}
