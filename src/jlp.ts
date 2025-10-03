import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getCustodyUsdcPrice } from "./oracle";
import { CUSTODY_PUBKEY, JLP_DECIMALS, JLP_MINT_PUBKEY, JUPITER_PERPETUALS_PROGRAM, RPC_CONNECTION, USDC_DECIMALS } from "./constants";
import { Custody, CustodyView, JLPView, OraclePrice } from "./types";
import {
    theoreticallyOwned,
    getDebt,
    getGlobalShortPnl,
    getAssetAmountUsd,
} from "./examples/calculate-pool-aum";
import { getMint } from "@solana/spl-token";

export async function getCustodyView(symbol: string, pubkey: PublicKey): Promise<CustodyView> {
    // Fetch custody data and price in parallel for better performance
    const [custody, price] = await Promise.all([
        JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(pubkey) as Promise<Custody>,
        getCustodyUsdcPrice(symbol)
    ]);

    const oraclePrice: OraclePrice = {
        price,
        exponent: -USDC_DECIMALS,
    };

    // Calculate common values once
    const owned = theoreticallyOwned(custody);
    const debt = getDebt(custody);
    const netAmount = custody.isStable
        ? owned
        : BN.max(new BN(0), owned.sub(custody.assets.locked));

    // Initialize base view object
    const view: CustodyView = {
        symbol,
        pubkey,
        price,
        isStable: custody.isStable,
        owned,
        locked: custody.assets.locked,
        debt,
        decimals: custody.decimals,
        guaranteedUsd: custody.assets.guaranteedUsd,
        globalShortSizes: custody.assets.globalShortSizes,
        globalShortAveragePrices: custody.assets.globalShortAveragePrices,
        tradersPnlDelta: new BN(0),
        tradersHasProfit: false,
        aumUsd: new BN(0),
        netAmount,
    };

    // Calculate AUM based on asset type
    if (custody.isStable) {
        // For stable assets, AUM is simply the USD value of net amount
        view.aumUsd = getAssetAmountUsd(oraclePrice, netAmount, custody.decimals);
    } else {
        // For non-stable assets, start with guaranteed USD
        view.aumUsd = custody.assets.guaranteedUsd;

        // Add net assets USD value
        const netAssetsUsd = getAssetAmountUsd(oraclePrice, netAmount, custody.decimals);
        view.aumUsd = view.aumUsd.add(netAssetsUsd);

        // Handle short positions PnL if any
        if (custody.assets.globalShortSizes.gtn(0)) {
            const { tradersPnlDelta, tradersHasProfit } = getGlobalShortPnl(custody, price);

            view.tradersPnlDelta = tradersPnlDelta;
            view.tradersHasProfit = tradersHasProfit;

            // Adjust AUM based on traders' PnL
            if (tradersHasProfit) {
                // Pool loses when traders profit
                view.aumUsd = BN.max(new BN(0), view.aumUsd.sub(tradersPnlDelta));
            } else {
                // Pool gains when traders lose
                view.aumUsd = view.aumUsd.add(tradersPnlDelta);
            }
        }
    }

    return view;
}

export async function getJLPView(): Promise<JLPView> {
    const [btc, eth, sol, usdc, usdt, mint] = await Promise.all([
        getCustodyView("BTC", new PublicKey(CUSTODY_PUBKEY.BTC)),
        getCustodyView("ETH", new PublicKey(CUSTODY_PUBKEY.ETH)),
        getCustodyView("SOL", new PublicKey(CUSTODY_PUBKEY.SOL)),
        getCustodyView("USDC", new PublicKey(CUSTODY_PUBKEY.USDC)),
        getCustodyView("USDT", new PublicKey(CUSTODY_PUBKEY.USDT)),
        getMint(RPC_CONNECTION, JLP_MINT_PUBKEY, "confirmed"),
    ])

    const custodyViews = [btc, eth, sol, usdc, usdt];
    const totalAumUsd = custodyViews.reduce((acc, view) => acc.add(view.aumUsd), new BN(0));

    const jlpVirtualPrice = totalAumUsd
        // Give some buffer to the numerator so that we don't get a quotient that is large enough to give us precision for the JLP virtual price
        .muln(Math.pow(10, JLP_DECIMALS))
        .div(new BN(mint.supply));

    return {
        Supply: mint.supply,
        Price: jlpVirtualPrice,
        TotalAumUsd: totalAumUsd,
        CustodyViews: custodyViews,
    };
}
