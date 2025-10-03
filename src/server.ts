import express, { Request, Response } from 'express';
import cors from 'cors';
import { BN } from '@coral-xyz/anchor';
import { getJLPView } from './jlp';
import { BNToUSDRepresentation } from './utils';
import { USDC_DECIMALS, JLP_DECIMALS } from './constants';
import { CustodyView, JLPView } from './types';

const app = express();
const PORT = process.env.PORT || 7988;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to serialize CustodyView for JSON response
function serializeCustodyView(custodyView: CustodyView, shares: BN) {
    return {
        ...custodyView,
        pubkey: custodyView.pubkey.toString(),
        price: BNToUSDRepresentation(custodyView.price, USDC_DECIMALS),
        owned: BNToUSDRepresentation(custodyView.owned, custodyView.decimals),
        locked: BNToUSDRepresentation(custodyView.locked, custodyView.decimals),
        debt: BNToUSDRepresentation(custodyView.debt, USDC_DECIMALS),
        netAmount: BNToUSDRepresentation(custodyView.netAmount, custodyView.decimals),
        guaranteedUsd: BNToUSDRepresentation(custodyView.guaranteedUsd, USDC_DECIMALS),
        globalShortSizes: BNToUSDRepresentation(custodyView.globalShortSizes, USDC_DECIMALS),
        globalShortAveragePrices: BNToUSDRepresentation(custodyView.globalShortAveragePrices, USDC_DECIMALS),
        tradersPnlDelta: BNToUSDRepresentation(custodyView.tradersPnlDelta, USDC_DECIMALS),
        aumUsd: BNToUSDRepresentation(custodyView.aumUsd, USDC_DECIMALS),
        position: BNToUSDRepresentation(shares.mul(custodyView.netAmount), custodyView.decimals, 8),
    };
}

// Helper function to serialize JLPView for JSON response
function serializeJLPView(jlpView: JLPView, jlpAmount: BN) {
    const shares = jlpAmount.div(jlpView.supply) as BN;
    return {
        jlpAmount: BNToUSDRepresentation(jlpAmount, JLP_DECIMALS),
        supply: BNToUSDRepresentation(jlpView.supply, JLP_DECIMALS),
        shares: Number(shares).toFixed(16),
        price: BNToUSDRepresentation(jlpView.price, USDC_DECIMALS, 4),
        totalAumUsd: BNToUSDRepresentation(jlpView.totalAumUsd, USDC_DECIMALS),
        custodyViews: jlpView.custodyViews.map(custodyView => serializeCustodyView(custodyView, shares)),
    };
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'jupiter-perps-jlp-api'
    });
});

// JLP Info endpoint
app.get('/api/jlp-info', async (req: Request, res: Response) => {
    try {
        console.log('Fetching JLP info...');
        const jlpView = await getJLPView();

        // Read JLP amount from query and convert to BN, default to 0
        let jlpAmount: BN;
        if (req.query.amount) {
            try {
                jlpAmount = new BN(req.query.amount as string);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid amount parameter. Must be a valid number.',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            jlpAmount = new BN(0);
        }

        // scale with jlp decimals
        jlpAmount = jlpAmount.muln(Math.pow(10, JLP_DECIMALS));
        const serializedResponse = serializeJLPView(jlpView, jlpAmount);

        res.json({
            success: true,
            data: serializedResponse,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching JLP info:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Jupiter Perps JLP API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 JLP Info: http://localhost:${PORT}/api/jlp-info`);
});

export default app;
