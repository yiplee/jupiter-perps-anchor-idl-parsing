import { BN } from "@coral-xyz/anchor";

/**
 * Get custody USDC price using Binance ticker API
 * @param symbol - The token symbol (e.g., 'BTC', 'USDC', 'USDT')
 * @returns Promise<BN> - Price in USDC, scaled by 1e6 for 6 decimal precision
 */
export async function getCustodyUsdcPrice(symbol: string): Promise<BN> {
    const normalizedSymbol = symbol.toUpperCase();

    // If it's USDC, return 1
    if (normalizedSymbol === 'USDC') {
        return new BN(1_000_000); // 1 USDC = 1 USDC (with 6 decimals)
    }

    try {
        let binanceSymbol: string;

        if (normalizedSymbol === 'USDT') {
            // For USDT, get USDC/USDT price and take inverse
            binanceSymbol = 'USDCUSDT';
        } else {
            // For other tokens, get TOKEN/USDC price
            binanceSymbol = `${normalizedSymbol}USDC`;
        }

        console.log(`Fetching price for ${binanceSymbol}`);
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as {
            symbol: string;
            price: string;
        };
        const price = parseFloat(data.price);

        if (normalizedSymbol === 'USDT') {
            // For USDT, take inverse of USDC/USDT price
            return new BN(Math.floor(1 / price * 1_000_000)); // Scale by 1e6
        } else {
            // For other tokens, return TOKEN/USDC price
            return new BN(Math.floor(price * 1_000_000)); // Scale by 1e6
        }

    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        throw new Error(`Failed to get USDC price for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
