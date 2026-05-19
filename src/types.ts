export interface OptimizedFileIndex {
    fileName: string;
    accountPrefix: string;
    earliestDate: Date;
    latestDate: Date;
    rawData: any[];
}

export interface PositionState {
    ticker: string;
    account: string;
    totalShares: number;
    totalInvested: number;
    averageBuyPrice: number;
    realizedPnL: number;
    isClosed: boolean;
}

export interface PortfolioAggregate {
    positions: Record<string, PositionState>;
    globalPnL: number;
}
