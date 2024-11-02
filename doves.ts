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
  USDC = "G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa",
  USDT = "4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk",
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
  [CUSTODY.USDC]: {
    mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    dovesOracle: new PublicKey("A28T5pKtscnhDo6C1Sz786Tup88aTjt8uyKewjVvPrGk"),
  },
  [CUSTODY.USDT]: {
    mint: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    dovesOracle: new PublicKey("AGW7q2a3WxCzh5TB2Q6yNde1Nf41g3HLaaXdybz7cbBU"),
  },
};

const DOVES_ORACLES = [
  {
    name: "SOL",
    publicKey: CUSTODY_DETAILS[CUSTODY.SOL].dovesOracle,
    custody: CUSTODY.SOL,
  },
  {
    name: "ETH",
    publicKey: CUSTODY_DETAILS[CUSTODY.ETH].dovesOracle,
    custody: CUSTODY.ETH,
  },
  {
    name: "BTC",
    publicKey: CUSTODY_DETAILS[CUSTODY.BTC].dovesOracle,
    custody: CUSTODY.BTC,
  },
  {
    name: "USDC",
    publicKey: CUSTODY_DETAILS[CUSTODY.USDC].dovesOracle,
    custody: CUSTODY.USDC,
  },
  {
    name: "USDT",
    publicKey: CUSTODY_DETAILS[CUSTODY.USDT].dovesOracle,
    custody: CUSTODY.USDT,
  },
];

/* Types */

interface DovesOraclePrice {
  price: BN;
  priceUsd: string;
  timestamp: number;
  expo: number;
}

type CustodyToOraclePrice = Record<string, DovesOraclePrice>;

/* Functions */

function BNToUSDRepresentation(
  value: BN,
  exponent: number = 8,
  displayDecimals: number = 2,
): string {
  const quotient = value.divn(Math.pow(10, exponent - displayDecimals));
  const usd = Number(quotient) / Math.pow(10, displayDecimals);

  return usd.toLocaleString("en-US", {
    maximumFractionDigits: displayDecimals,
    minimumFractionDigits: displayDecimals,
    useGrouping: false,
  });
}

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
      priceUsd: BNToUSDRepresentation(feed.price, Math.abs(feed.expo)),
      timestamp: feed.timestamp.toNumber(),
      expo: feed.expo,
    };

    cache[custody.toString()] = data;
  });
}

export async function subscribeOraclePrices(intervalMs: number = 100) {
  const cache = DOVES_ORACLES.reduce((cache, entries) => {
    cache[entries.custody.toString()] = {
      price: new BN(0),
      priceUsd: "0",
      timestamp: 0,
      expo: 0,
    };

    return cache;
  }, {} as CustodyToOraclePrice);

  // Initialize the oracle price cache
  await fetchAndUpdateOraclePriceData(cache);

  // Poll for price updates every `intervalMs` milliseconds
  const pollPriceUpdates = async () => {
    try {
      await fetchAndUpdateOraclePriceData(cache);
      console.log(cache);
    } catch (err) {
      console.error("Failed to fetch and update oracle price: ", err);
    } finally {
      setTimeout(pollPriceUpdates, intervalMs);
    }
  };

  pollPriceUpdates();

  // Stream price updates in addition to polling for price updates above. This alone is enough for most cases
  // but polling helps in case `onProgramAccountChange` misses price updates
  connection.onProgramAccountChange(
    DOVES_PROGRAM_ID,
    ({ accountId, accountInfo }) => {
      const oracle = DOVES_ORACLES.find((oracle) =>
        oracle.publicKey.equals(accountId),
      );

      if (!oracle) {
        throw new Error(
          `Cannot find custody details for account: ${accountId.toString()}`,
        );
      }

      const priceFeed = dovesProgram.coder.accounts.decode(
        "priceFeed",
        accountInfo.data,
      );

      const data: DovesOraclePrice = {
        price: priceFeed.price,
        priceUsd: BNToUSDRepresentation(
          priceFeed.price,
          Math.abs(priceFeed.expo),
        ),
        timestamp: priceFeed.timestamp.toNumber(),
        expo: priceFeed.expo,
      };

      cache[oracle.custody.toString()] = data;
    },
    { commitment: "confirmed" },
  );

  return cache;
}

subscribeOraclePrices();
