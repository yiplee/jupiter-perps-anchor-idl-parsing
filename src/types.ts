import type { IdlAccounts, ProgramAccount, IdlTypes, BN } from "@coral-xyz/anchor";
import { type Perpetuals } from "./idl/jupiter-perpetuals-idl";
import { PublicKey } from "@solana/web3.js";
import { USDC_DECIMALS } from "./constants";

export type BorrowPosition = IdlAccounts<Perpetuals>["borrowPosition"];
export type Position = IdlAccounts<Perpetuals>["position"];
export type PositionAccount = ProgramAccount<Position>;

export type PositionRequest = IdlAccounts<Perpetuals>["positionRequest"];
export type PositionRequestAccount = ProgramAccount<PositionRequest>;

export type Custody = IdlAccounts<Perpetuals>["custody"];
export type CustodyAccount = ProgramAccount<Custody>;

export type ContractTypes = IdlTypes<Perpetuals>;
export type Pool = IdlAccounts<Perpetuals>["pool"];
export type PoolApr = ContractTypes["PoolApr"];
export type OraclePrice = IdlTypes<Perpetuals>["OraclePrice"];

export interface CustodyView {
    symbol: string;
    pubkey: PublicKey;
    isStable: boolean;
    price: BN;
    owned: BN;
    locked: BN;
    debt: BN;
    netAmount: BN;
    decimals: number;
    guaranteedUsd: BN;
    globalShortSizes: BN;
    globalShortAveragePrices: BN;
    tradersPnlDelta: BN;
    tradersHasProfit: boolean;
    aumUsd: BN;
}

export interface JLPView {
    supply: BN;
    price: BN;
    totalAumUsd: BN;
    custodyViews: CustodyView[];
}
