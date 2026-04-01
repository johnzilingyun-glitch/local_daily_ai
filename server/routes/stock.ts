import express from 'express';
import yahooFinance from 'yahoo-finance2';
import { APIError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/realtime', async (req, res, next) => {
  const { symbol, market, symbols } = req.query;
  
  if (symbols && typeof symbols === 'string' && symbols.trim()) {
    try {
      const rawSymbolList = symbols.split(',').map(s => s.trim()).filter(s => !!s);
      const symbolList = rawSymbolList.map(s => {
        let sym = s.toUpperCase();
        if (sym.endsWith('.SH')) sym = sym.replace('.SH', '.SS');
        if (sym.length === 6) {
          if (sym.startsWith('60') || sym.startsWith('68')) return `${sym}.SS`;
          if (sym.startsWith('00') || sym.startsWith('30')) return `${sym}.SZ`;
          if (sym.startsWith('8') || sym.startsWith('4')) return `${sym}.BJ`;
        }
        return sym;
      });

      let results: any[];
      try {
        results = (await yahooFinance.quote(symbolList as any)) as any[];
      } catch (quoteErr) {
        results = [];
        for (const sym of symbolList) {
          try {
            const q = await yahooFinance.quote(sym as any);
            if (q) results.push(q);
          } catch (e) {}
        }
      }
      
      const formattedResults = results.map(result => {
        let changePercent = result.regularMarketChangePercent;
        let change = result.regularMarketChange;
        const price = result.regularMarketPrice;
        const prevClose = result.regularMarketPreviousClose;

        if (change === undefined && price !== undefined && prevClose !== undefined) {
          change = price - prevClose;
        }
        if (changePercent === undefined && change !== undefined && prevClose !== undefined && prevClose !== 0) {
          changePercent = (change / prevClose) * 100;
        }

        if (changePercent !== undefined && Math.abs(changePercent) < 0.1 && changePercent !== 0 && change !== undefined && price !== undefined) {
           if (Math.abs(change) > 0.005 * price) {
             changePercent = changePercent * 100;
           }
        }

        const marketTime = result.regularMarketTime ? new Date(result.regularMarketTime) : new Date();
        return {
          symbol: result.symbol,
          name: result.shortName || result.longName || result.symbol,
          price: price,
          change: change !== undefined ? parseFloat(change.toFixed(2)) : 0,
          changePercent: changePercent !== undefined ? parseFloat(changePercent.toFixed(2)) : 0,
          previousClose: prevClose,
          currency: result.currency,
          lastUpdated: marketTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          marketState: result.marketState,
          source: 'Yahoo Finance API',
          exchange: result.fullExchangeName || result.exchange,
          quoteDelay: result.exchangeDataDelayedBy || 0
        };
      });
      return res.json(formattedResults);
    } catch (error) {
      return next(new APIError('Failed to fetch batch stock data', 500));
    }
  }

  if (!symbol || !market) {
    return next(new APIError('Symbol and market are required', 400));
  }

  try {
    let yfSymbol = (symbol as string).trim().toUpperCase().replace('.SH', '.SS');
    
    if (!yfSymbol.includes('.') && !yfSymbol.startsWith('^')) {
      if (market === 'A-Share' && /^\d{6}$/.test(yfSymbol)) {
        if (yfSymbol.startsWith('60') || yfSymbol.startsWith('68')) yfSymbol = `${yfSymbol}.SS`;
        else yfSymbol = `${yfSymbol}.SZ`;
      } else if (market === 'HK-Share' && /^\d+$/.test(yfSymbol)) {
        yfSymbol = `${yfSymbol.padStart(5, '0')}.HK`;
      }
    }

    const hasChinese = /[\u4e00-\u9fa5]/.test(symbol as string);
    let result = null;

    // Only try direct quote if it doesn't contain Chinese and looks like a ticker/index
    if (!hasChinese) {
      try {
        result = (await yahooFinance.quote(yfSymbol)) as any;
      } catch (e) {
        // Safe to ignore, we'll try search next
        console.log(`[QUOTE_FALLBACK] Direct lookup failed for ${yfSymbol}, trying search...`);
      }
    }
    
    if (!result) {
      const searchResults = (await yahooFinance.search((symbol as string).trim())) as any;
      if (searchResults.quotes && searchResults.quotes.length > 0) {
        const bestMatch = searchResults.quotes.find((q: any) => {
          const symMatch = (q.symbol || '').toUpperCase();
          if (market === 'A-Share') return symMatch.endsWith('.SS') || symMatch.endsWith('.SZ') || symMatch.endsWith('.BJ');
          if (market === 'HK-Share') return symMatch.endsWith('.HK');
          if (market === 'US-Share') return !symMatch.endsWith('.SS') && !symMatch.endsWith('.SZ') && !symMatch.endsWith('.BJ') && !symMatch.endsWith('.HK');
          return true;
        });
        if (bestMatch) {
          try {
            result = await yahooFinance.quote(bestMatch.symbol as any);
          } catch (e) {
             console.error(`[SEARCH_QUOTE_ERROR] Failed to quote best match ${bestMatch.symbol}`);
          }
        }
      }
    }

    if (!result) return next(new APIError(`无法找到代码 "${symbol}" 的相关数据。`, 404));

    let changePercent = result.regularMarketChangePercent;
    let change = result.regularMarketChange;
    const price = result.regularMarketPrice;
    const prevClose = result.regularMarketPreviousClose;

    if (change === undefined && price !== undefined && prevClose !== undefined) change = price - prevClose;
    if (changePercent === undefined && change !== undefined && prevClose !== undefined && prevClose !== 0) changePercent = (change / prevClose) * 100;

    const dataTime = result.regularMarketTime ? new Date(result.regularMarketTime) : new Date();
    res.json({
      symbol: result.symbol || symbol,
      name: result.shortName || result.longName || symbol,
      price: price,
      change: change !== undefined ? parseFloat(change.toFixed(2)) : 0,
      changePercent: changePercent !== undefined ? parseFloat(changePercent.toFixed(2)) : 0,
      previousClose: prevClose,
      open: result.regularMarketOpen,
      dayHigh: result.regularMarketDayHigh,
      dayLow: result.regularMarketDayLow,
      volume: result.regularMarketVolume,
      marketCap: result.marketCap,
      pe: result.trailingPE,
      currency: result.currency,
      lastUpdated: dataTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ' CST',
      source: 'Yahoo Finance API',
      exchange: result.fullExchangeName || result.exchange,
      marketState: result.marketState,
      quoteDelay: result.exchangeDataDelayedBy || 0
    });
  } catch (error) {
    next(new APIError('Failed to fetch real-time stock data', 500));
  }
});

export default router;
