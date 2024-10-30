import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { IDL as DovesIDL } from "./doves-idl";

/* Constants */

const connection = new Connection("https://api.mainnet-beta.solana.com");

const DOVES_PROGRAM_ID = new PublicKey(
  "DoVEsk76QybCEHQGzkvYPWLQu9gzNoZZZt3TPiL597e",
);

const dovesProgram = new Program(
  DovesIDL,
  DOVES_PROGRAM_ID,
  new AnchorProvider(connection, new Wallet(Keypair.generate()), {
    preflightCommitment: "processed",
  }),
);

enum CUSTODY {
  SOL = "7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz",
  ETH = "AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn",
  BTC = "5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm",
}

const CUSTODY_DETAILS = {
  [CUSTODY.SOL]: {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    dovesOracle: new PublicKey("39cWjvHrpHNz2SbXv6ME4NPhqBDBd4KsjUYv5JkHEAJU"),
  },
  [CUSTODY.ETH]: {
    mint: new PublicKey("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),
    dovesOracle: new PublicKey("5URYohbPy32nxK1t3jAHVNfdWY2xTubHiFvLrE3VhXEp"),
  },
  [CUSTODY.BTC]: {
    mint: new PublicKey("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"),
    dovesOracle: new PublicKey("4HBbPx9QJdjJ7GUe6bsiJjGybvfpDhQMMPXP1UEa7VT5"),
  },
};

const DOVES_ORACLES = [
  {
    publicKey: CUSTODY_DETAILS[CUSTODY.SOL].dovesOracle,
    custody: CUSTODY.SOL,
  },
  {
    publicKey: CUSTODY_DETAILS[CUSTODY.ETH].dovesOracle,
    custody: CUSTODY.ETH,
  },
  {
    publicKey: CUSTODY_DETAILS[CUSTODY.BTC].dovesOracle,
    custody: CUSTODY.BTC,
  },
];

/* Types */

interface DovesOraclePrice {
  price: BN;
  timestamp: number;
  expo: number;
}

type CustodyToOraclePrice = Record<string, DovesOraclePrice>;

/* Functions */

async function fetchAndUpdateOraclePriceData(cache: CustodyToOraclePrice) {
  const dovesPubkey = DOVES_ORACLES.map(({ publicKey }) => publicKey);
  const feeds = await dovesProgram.account.priceFeed.fetchMultiple(dovesPubkey);

  DOVES_ORACLES.forEach(({ custody }, index) => {
    const feed = feeds[index];

    if (!feed) {
      throw new Error(
        `Failed to fetch latest oracle price data for: ${custody.toString()}`,
      );
    }

    const data: DovesOraclePrice = {
      price: feed.price,
      timestamp: feed.timestamp.toNumber(),
      expo: feed.expo,
    };

    cache[custody.toString()] = data;
  });
}

export async function subscribeOraclePrices(
  intervalMs: number = 100,
): Promise<CustodyToOraclePrice> {
  const cache = DOVES_ORACLES.reduce((cache, entries) => {
    cache[entries.custody.toString()] = {
      price: new BN(0),
      timestamp: 0,
      expo: 0,
    };

    return cache;
  }, {} as CustodyToOraclePrice);

  await fetchAndUpdateOraclePriceData(cache);

  const subscribe = async () => {
    try {
      await fetchAndUpdateOraclePriceData(cache);
      console.log(cache);
    } catch (err) {
      console.error("Failed to fetch and update oracle price: ", err);
    } finally {
      setTimeout(subscribe, intervalMs);
    }
  };

  subscribe();

  return cache;
}

subscribeOraclePrices();
