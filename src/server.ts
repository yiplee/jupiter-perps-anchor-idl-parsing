import express, { Request, Response } from 'express';
import cors from 'cors';
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
function serializeCustodyView(custodyView: CustodyView) {
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
    };
}

// Helper function to serialize JLPView for JSON response
function serializeJLPView(jlpView: JLPView) {
    return {
        supply: BNToUSDRepresentation(jlpView.supply, JLP_DECIMALS),
        price: BNToUSDRepresentation(jlpView.price, USDC_DECIMALS, 4),
        totalAumUsd: BNToUSDRepresentation(jlpView.totalAumUsd, USDC_DECIMALS),
        custodyViews: jlpView.custodyViews.map(serializeCustodyView),
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
        const serializedResponse = serializeJLPView(jlpView);

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
