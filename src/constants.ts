import {
  AnchorProvider,
  Program,
  Wallet,
  utils,
  type IdlAccounts,
} from "@coral-xyz/anchor";
import { IDL, type Perpetuals } from "./idl/jupiter-perpetuals-idl";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export const RPC_CONNECTION = new Connection(
  process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
);

export const JUPITER_PERPETUALS_PROGRAM_ID = new PublicKey(
  "PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu",
);

export const JUPITER_PERPETUALS_EVENT_AUTHORITY_PUBKEY = new PublicKey(
  "37hJBDnntwqhGbK7L6M1bLyvccj4u55CCUiLPdYkiqBN",
);

export const JLP_POOL_ACCOUNT_PUBKEY = new PublicKey(
  "5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq",
);

export const JUPITER_PERPETUALS_PROGRAM = new Program<Perpetuals>(
  IDL,
  JUPITER_PERPETUALS_PROGRAM_ID,
  new AnchorProvider(
    RPC_CONNECTION,
    new Wallet(Keypair.generate()),
    AnchorProvider.defaultOptions(),
  ),
);

export enum CUSTODY_PUBKEY {
  SOL = "7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz",
  ETH = "AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn",
  BTC = "5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm",
  USDC = "G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa",
  USDT = "4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk",
}
