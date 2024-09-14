import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { IDL, type Perpetuals } from "./idl";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

async function getCustodyAssets() {
  try {
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const program = new Program<Perpetuals>(
      IDL,
      new PublicKey("PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu"),
      new AnchorProvider(
        connection,
        new Wallet(Keypair.generate()),
        AnchorProvider.defaultOptions(),
      ),
    );

    const solCustody = await program.account.custody.fetch(
      new PublicKey("7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz"),
    );

    const custodyAssetsData = Object.fromEntries(
      Object.entries(solCustody.assets).map(([key, value]) => [
        key,
        // @ts-ignore
        value.toString(),
      ]),
    );

    console.log("Custody data: ", custodyAssetsData);
  } catch (error) {
    console.error("Failed to parse Jupiter Perps IDL", error);
  }
}

getCustodyAssets();
