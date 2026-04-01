import express from 'express';
import YahooFinance from 'yahoo-finance2';
import { APIError } from '../middleware/errorHandler';

const router = express.Router();
const yahooFinance = new YahooFinance();

const indexSymbols: Record<string, { symbol: string; name: string }[]> = {
  'A-Share': [
    { symbol: '000001.SS', name: '上证综指' },
    { symbol: '399001.SZ', name: '深证成指' },
    { symbol: '399006.SZ', name: '创业板指' },
    { symbol: '000300.SS', name: '沪深300' },
    { symbol: '^HSI', name: '恒生指数' },
  ],
  'HK-Share': [
    { symbol: '^HSI', name: '恒生指数' },
    { symbol: '^HSTECH', name: '恒生科技指数' },
    { symbol: '^HSCE', name: '国企指数' },
    { symbol: '^HSCCI', name: '红筹指数' },
    { symbol: '^S&P/HKEX GEM', name: '创业板指数' },
  ],
  'US-Share': [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: '纳斯达克综合' },
    { symbol: '^DJI', name: '道琼斯工业' },
    { symbol: '^RUT', name: '罗素2000' },
    { symbol: '^SOX', name: '费城半导体' },
  ],
};

const commoditySymbols = [
  { symbol: 'GC=F', name: '伦敦金 (XAU)', unit: '$/oz' },
  { symbol: 'HG=F', name: 'LME铜 (HG)', unit: '$/lb' },
  { symbol: 'CL=F', name: '原油 (WTI)', unit: '$/bbl' },
  { symbol: 'SI=F', name: '白银', unit: '$/oz' },
];

router.get('/indices', async (req, res, next) => {
  const { market } = req.query;
  const marketKey = (market as string) || 'A-Share';
  const symbols = indexSymbols[marketKey] || indexSymbols['A-Share'];

  try {
    const results = [];
    for (const idx of symbols) {
      try {
        const quote = (await yahooFinance.quote(idx.symbol as any)) as any;
        if (quote) {
          const price = quote.regularMarketPrice;
          const prevClose = quote.regularMarketPreviousClose;
          let change = quote.regularMarketChange;
          let changePercent = quote.regularMarketChangePercent;

          if (change === undefined && price !== undefined && prevClose !== undefined) {
            change = price - prevClose;
          }
          if (changePercent === undefined && change !== undefined && prevClose !== undefined && prevClose !== 0) {
            changePercent = (change / prevClose) * 100;
          }

          const marketTime = quote.regularMarketTime ? new Date(quote.regularMarketTime) : new Date();
          const formattedTime = marketTime.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          results.push({
            name: idx.name,
            symbol: idx.symbol,
            price: price,
            change: change !== undefined ? parseFloat(change.toFixed(2)) : 0,
            changePercent: changePercent !== undefined ? parseFloat(changePercent.toFixed(2)) : 0,
            previousClose: prevClose,
            lastUpdated: formattedTime + ' CST',
            source: 'Yahoo Finance API',
            marketState: quote.marketState,
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch index ${idx.symbol}:`, e);
      }
    }
    res.json(results);
  } catch (error) {
    next(new APIError('Failed to fetch indices data', 500));
  }
});

router.get('/commodities', async (req, res, next) => {
  try {
    const results = [];
    for (const item of commoditySymbols) {
      try {
        const quote = (await yahooFinance.quote(item.symbol)) as any;
        if (quote) {
          results.push({
            name: item.name,
            symbol: item.symbol,
            price: quote.regularMarketPrice,
            changePercent: quote.regularMarketChangePercent !== undefined ? parseFloat(quote.regularMarketChangePercent.toFixed(2)) : 0,
            unit: item.unit,
            lastUpdated: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ' CST'
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch commodity ${item.symbol}:`, e);
      }
    }
    res.json(results);
  } catch (error) {
    next(new APIError('Failed to fetch commodities data', 500));
  }
});

export default router;
