import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // History and Optimization Log
  const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');
  const LOG_FILE = path.join(process.cwd(), 'data', 'optimization_log.json');

  // Ensure directories exist
  if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'));
  }
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR);
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  }

  function addLogEntry(field: string, oldValue: any, newValue: any, description: string) {
    try {
      const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      logs.push({
        timestamp: new Date().toISOString(),
        field,
        oldValue,
        newValue,
        description
      });
      fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.error('Failed to add log entry:', err);
    }
  }

  function saveAnalysis(type: 'market' | 'stock', data: any) {
    try {
      const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const dataWithId = { ...data, id };
      const filename = `${type}_${new Date().toISOString().replace(/[:.]/g, '-')}_${Math.random().toString(36).substr(2, 5)}.json`;
      const filePath = path.join(HISTORY_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(dataWithId, null, 2));
      console.log(`Analysis saved to ${filePath} with ID ${id}`);
    } catch (err) {
      console.error('Failed to save analysis:', err);
      throw err;
    }
  }

  app.get('/api/history/context', (req, res) => {
    try {
      const files = fs.readdirSync(HISTORY_DIR).sort().reverse().slice(0, 10);
      const history = files.map(f => JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8')));
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read history' });
    }
  });

  app.get('/api/logs/optimization', (req, res) => {
    try {
      const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read logs' });
    }
  });

  app.post('/api/history/save', (req, res) => {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }
    try {
      saveAnalysis(type, data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save analysis to history', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/logs/add', (req, res) => {
    const { field, oldValue, newValue, description } = req.body;
    if (!field || !description) {
      return res.status(400).json({ error: 'Field and description are required' });
    }
    addLogEntry(field, oldValue, newValue, description);
    res.json({ success: true });
  });

  // Feishu Webhook endpoint
  app.post('/api/feishu/send-report', async (req, res) => {
    const { content, feishuWebhookUrl } = req.body;
    // Prioritize URL from client request, fallback to environment variable
    const webhookUrl = feishuWebhookUrl || process.env.FEISHU_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.status(500).json({ error: '飞书 Webhook 未配置。请在系统设置中填入 Webhook URL。' });
    }

    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    // Feishu character limit is around 30k chars. Truncate if necessary to avoid API failure.
    const TRUNCATE_LIMIT = 28000;
    let finalContent = content;
    if (finalContent.length > TRUNCATE_LIMIT) {
      finalContent = finalContent.substring(0, TRUNCATE_LIMIT) + '\n\n... (由于长度确认，已截断剩余内容)';
    }

    try {
      // Determine card title and template based on report type
      let title = 'AI 交易研报';
      let template = 'blue';

      if (req.body.type === 'daily') {
        title = '📅 市场晨间内参';
        template = 'orange';
      } else if (req.body.type === 'discussion') {
        title = '🚀 联席专家研报总结';
        template = 'indigo';
      } else if (req.body.type === 'chat') {
        title = '🧠 深度追问解答';
        template = 'turquoise';
      } else if (req.body.type === 'stock') {
        title = '🔍 个股速览报告';
        template = 'green';
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msg_type: 'interactive',
          card: {
            header: {
              title: {
                tag: 'plain_text',
                content: title,
              },
              template: template,
            },
            elements: [
              {
                tag: 'div',
                text: {
                  tag: 'lark_md',
                  content: finalContent,
                },
              },
              {
                tag: 'hr',
              },
              {
                tag: 'note',
                elements: [
                  {
                    tag: 'plain_text',
                    content: `由 TradingAgents AI 专家组生成 • ${new Date().toLocaleString()}`,
                  },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || 'Feishu API 返回错误');
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Feishu Webhook Error:', error);
      res.status(500).json({ error: '无法发送报告至飞书，请检查 Webhook URL 是否正确。' });
    }
  });

  // Env Check Endpoint for debugging
  app.get('/api/history/env-check', (req, res) => {
    res.json({
      keys: Object.keys(process.env),
      feishuWebhookDefined: !!process.env.FEISHU_WEBHOOK_URL,
      appUrl: process.env.APP_URL,
      nodeEnv: process.env.NODE_ENV
    });
  });

  // Market Indices Endpoint (used by marketService for ground truth data)
  app.get('/api/stock/indices', async (req, res) => {
    const { market } = req.query;
    console.log(`API Request: /api/stock/indices - market: ${market}`);

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

    const marketKey = (market as string) || 'A-Share';
    const symbols = indexSymbols[marketKey] || indexSymbols['A-Share'];

    try {
      const results = [];
      for (const idx of symbols) {
        try {
          const quote = await yahooFinance.quote(idx.symbol as any) as any;
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
          console.warn(`Failed to fetch index ${idx.symbol}:`, e instanceof Error ? e.message : String(e));
        }
      }

      console.log(`Successfully fetched ${results.length}/${symbols.length} indices for ${marketKey}`);
      res.json(results);
    } catch (error) {
      console.error('Indices fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch indices data', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Commodities Endpoint
  app.get('/api/stock/commodities', async (req, res) => {
    console.log('API Request: /api/stock/commodities');
    const commoditySymbols = [
      { symbol: 'GC=F', name: '伦敦金 (XAU)', unit: '$/oz' },
      { symbol: 'HG=F', name: 'LME铜 (HG)', unit: '$/lb' },
      { symbol: 'CL=F', name: '原油 (WTI)', unit: '$/bbl' },
      { symbol: 'SI=F', name: '白银', unit: '$/oz' },
    ];

    try {
      const results = [];
      for (const item of commoditySymbols) {
        try {
          const quote = await yahooFinance.quote(item.symbol) as any;
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
          console.warn(`Failed to fetch commodity ${item.symbol}:`, e instanceof Error ? e.message : String(e));
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Commodities fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch commodities data', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Real-time Stock Data Endpoint
  app.get('/api/stock/realtime', async (req, res) => {
    const { symbol, market, symbols } = req.query;
    console.log(`API Request: /api/stock/realtime - symbol: ${symbol}, market: ${market}, symbols: ${symbols}`);
    
    // Handle multiple symbols if provided
    if (symbols && typeof symbols === 'string' && symbols.trim()) {
      try {
        const rawSymbolList = symbols.split(',').map(s => s.trim()).filter(s => !!s);
        if (rawSymbolList.length === 0) {
          return res.status(400).json({ error: 'No valid symbols provided' });
        }
        
        // Map symbols to Yahoo Finance format
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

        console.log(`Fetching batch quotes for: ${symbolList.join(', ')}`);
        let results: any[];
        try {
          results = await yahooFinance.quote(symbolList as any) as any[];
        } catch (quoteErr) {
          console.error(`Yahoo Batch Quote failed for [${symbolList.join(', ')}]:`, quoteErr);
          // If batch fails, try individual quotes to salvage what we can
          results = [];
          for (const sym of symbolList) {
            try {
              const q = await yahooFinance.quote(sym as any);
              if (q) results.push(q);
            } catch (e) {
              console.warn(`Individual quote failed for ${sym} in batch:`, e instanceof Error ? e.message : String(e));
            }
          }
        }
        
        if (!results || results.length === 0) {
          return res.status(404).json({ error: 'No valid data found for the provided symbols' });
        }
        
        // Format results to be consistent with single quote response
        const formattedResults = results.map(result => {
          let changePercent = result.regularMarketChangePercent;
          let change = result.regularMarketChange;
          const price = result.regularMarketPrice;
          const prevClose = result.regularMarketPreviousClose;

          // Fallback calculations
          if (change === undefined && price !== undefined && prevClose !== undefined) {
            change = price - prevClose;
          }
          if (changePercent === undefined && change !== undefined && prevClose !== undefined && prevClose !== 0) {
            changePercent = (change / prevClose) * 100;
          }

          // Robustness check for changePercent (decimal vs percentage)
          if (changePercent !== undefined && Math.abs(changePercent) < 0.1 && changePercent !== 0 && change !== undefined && price !== undefined) {
             // If changePercent is very small but change is significant, it's likely a decimal
             if (Math.abs(change) > 0.005 * price) {
               changePercent = changePercent * 100;
             }
          }

          const marketTime = result.regularMarketTime ? new Date(result.regularMarketTime) : new Date();
          const formattedTime = marketTime.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return {
            symbol: result.symbol,
            name: result.shortName || result.longName || result.symbol,
            price: price,
            change: change !== undefined ? parseFloat(change.toFixed(2)) : 0,
            changePercent: changePercent !== undefined ? parseFloat(changePercent.toFixed(2)) : 0,
            previousClose: prevClose,
            currency: result.currency,
            lastUpdated: formattedTime,
            marketState: result.marketState,
            source: 'Yahoo Finance API',
            exchange: result.fullExchangeName || result.exchange,
            quoteDelay: result.exchangeDataDelayedBy || 0
          };
        });

        console.log(`Successfully fetched and formatted ${formattedResults.length} quotes.`);
        return res.json(formattedResults);
      } catch (error) {
        console.error('Yahoo Finance Batch Error:', error);
        return res.status(500).json({ error: 'Failed to fetch batch stock data' });
      }
    }

    if (!symbol || typeof symbol !== 'string' || !symbol.trim() || !market) {
      return res.status(400).json({ error: 'Symbol and market are required' });
    }

    try {
      let yfSymbol = (symbol as string).trim().toUpperCase();
      
      // Handle common suffix variations
      yfSymbol = yfSymbol.replace('.SH', '.SS');
      
      // If the symbol already contains a dot or starts with a caret, assume it's already a valid Yahoo symbol
      if (!yfSymbol.includes('.') && !yfSymbol.startsWith('^')) {
        const isStandardA = market === 'A-Share' && /^\d{6}$/.test(yfSymbol);
        const isStandardHK = market === 'HK-Share' && /^\d{1,5}$/.test(yfSymbol);
        const isStandardUS = market === 'US-Share' && /^[A-Z]{1,5}$/.test(yfSymbol);

        // If not a standard code for the market, try East Money Suggest API
        if (!isStandardA && !isStandardHK && !isStandardUS) {
          try {
            const encodedInput = encodeURIComponent((symbol as string).trim());
            // Try a more reliable EastMoney Suggest API first
            const emUrl = `https://suggest.eastmoney.com/suggest/default.aspx?name=cb&input=${encodedInput}`;
            const response = await fetch(emUrl);
            const text = await response.text();
            const match = text.match(/^var cb = (\[.*\]);?$/);
            if (match && match[1]) {
              const data = JSON.parse(match[1]);
              if (Array.isArray(data) && data.length > 0) {
                // Find the best match for the requested market
                for (const item of data) {
                  const parts = item.split(',');
                  if (parts.length >= 4) {
                    const code = parts[1];
                    const fullCode = parts[3];
                    const emMarketType = parts[2];
                    const emMarketName = parts[6]; // e.g., "HK", "US", "SH", "SZ"

                    let isMatch = false;
                    if (market === 'A-Share' && (emMarketName === 'SH' || emMarketName === 'SZ' || emMarketName === 'BJ')) isMatch = true;
                    if (market === 'HK-Share' && emMarketName === 'HK') isMatch = true;
                    if (market === 'US-Share' && emMarketName === 'US') isMatch = true;

                    if (isMatch) {
                      console.log(`Smart Resolved '${yfSymbol}' to '${code}' via New EastMoney (Market: ${market})`);
                      yfSymbol = code;
                      break;
                    }
                  }
                }
              }
            }
            
            // If the new EastMoney API failed, try the old one as fallback
            if (yfSymbol === (symbol as string).trim().toUpperCase()) {
              // type=14 (A-Share), type=31 (HK-Share), type=32 (US-Share)
              let emType = '14';
              if (market === 'HK-Share') emType = '31';
              if (market === 'US-Share') emType = '32';
              
              const oldEmUrl = `https://searchapi.eastmoney.com/api/suggest/get?cb=cb&input=${encodedInput}&type=${emType}&token=D43BF722C8E33BDC906FB84D85E326E8`;
              const oldResponse = await fetch(oldEmUrl);
              const oldText = await oldResponse.text();
              const oldMatch = oldText.match(/^cb\((.*)\)$/);
              if (oldMatch && oldMatch[1]) {
                const oldData = JSON.parse(oldMatch[1]);
                if (oldData?.QuotationCodeTable?.Data?.length > 0) {
                  const bestMatch = oldData.QuotationCodeTable.Data[0];
                  const bestCode = bestMatch.Code;
                  if (bestCode) {
                    console.log(`Smart Resolved '${yfSymbol}' to '${bestCode}' via Old EastMoney (Market: ${market})`);
                    yfSymbol = bestCode;
                  }
                }
              }
            }
            
            // If still failed, try Sina Suggest API as fallback
            if (yfSymbol === (symbol as string).trim().toUpperCase()) {
              console.log(`EastMoney resolution failed for ${yfSymbol}, trying Sina...`);
              const sinaUrl = `https://suggest3.sinajs.cn/suggest/type=&key=${encodedInput}`;
              const sinaRes = await fetch(sinaUrl);
              const sinaText = await sinaRes.text();
              // Format: var suggestdata_1711790000000="腾讯控股,31,00700,00700,腾讯控股,TXKG";
              const sinaMatch = sinaText.match(/="([^"]+)"/);
              if (sinaMatch && sinaMatch[1]) {
                const parts = sinaMatch[1].split(';');
                for (const part of parts) {
                  const details = part.split(',');
                  if (details.length >= 3) {
                    const sinaCode = details[2];
                    const sinaMarket = details[1];
                    // 11=A-Share (SH), 12=A-Share (SZ), 31=HK, 41=US
                    if ((market === 'A-Share' && (sinaMarket === '11' || sinaMarket === '12')) ||
                        (market === 'HK-Share' && sinaMarket === '31') ||
                        (market === 'US-Share' && sinaMarket === '41')) {
                      console.log(`Smart Resolved '${yfSymbol}' to '${sinaCode}' via Sina (Market: ${market})`);
                      yfSymbol = sinaCode;
                      break;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Symbol resolution failed for ${yfSymbol} (${market}):`, error);
          }
        }

        if (market === 'A-Share') {
          // Only append suffix if it's a 6-digit number
          if (/^\d{6}$/.test(yfSymbol)) {
            if (yfSymbol.startsWith('60') || yfSymbol.startsWith('68')) {
              yfSymbol = `${yfSymbol}.SS`;
            } else if (yfSymbol.startsWith('00') || yfSymbol.startsWith('30')) {
              yfSymbol = `${yfSymbol}.SZ`;
            } else if (yfSymbol.startsWith('43') || yfSymbol.startsWith('83') || yfSymbol.startsWith('87')) {
              yfSymbol = `${yfSymbol}.BJ`;
            } else if (yfSymbol.startsWith('6')) {
              yfSymbol = `${yfSymbol}.SS`;
            } else {
              yfSymbol = `${yfSymbol}.SZ`;
            }
          }
        } else if (market === 'HK-Share') {
          if (/^\d+$/.test(yfSymbol)) {
            yfSymbol = `${yfSymbol.padStart(5, '0')}.HK`;
          }
        }
      }

      console.log(`Fetching quote for: ${yfSymbol} (Original: ${symbol}, Market: ${market})`);
      let result: any;
      try {
        result = await yahooFinance.quote(yfSymbol) as any;
        
        // Strict market validation
        if (result && result.symbol) {
          const symMatch = result.symbol.toUpperCase();
          if (market === 'A-Share' && !(symMatch.endsWith('.SS') || symMatch.endsWith('.SZ') || symMatch.endsWith('.BJ'))) {
            console.log(`Quote found ${symMatch} but it is not an A-Share. Discarding.`);
            result = null;
          } else if (market === 'HK-Share' && !symMatch.endsWith('.HK')) {
            console.log(`Quote found ${symMatch} but it is not a HK-Share. Discarding.`);
            result = null;
          } else if (market === 'US-Share' && (symMatch.endsWith('.SS') || symMatch.endsWith('.SZ') || symMatch.endsWith('.BJ') || symMatch.endsWith('.HK'))) {
            console.log(`Quote found ${symMatch} but it is not a US-Share. Discarding.`);
            result = null;
          }
        }
      } catch (e) {
        console.log(`Quote failed for ${yfSymbol}, trying search...`);
      }
      
      if (!result) {
        // Try searching if quote fails (might be a name or abbreviation)
        // If we have a resolved symbol that looks like a code, try searching for that first
        const searchQueries = [];
        if (yfSymbol !== symbol) {
          searchQueries.push(yfSymbol);
        }
        searchQueries.push((symbol as string).trim());

        for (const searchQuery of searchQueries) {
          if (!searchQuery) continue;
          
          console.log(`Attempting Yahoo Search for: "${searchQuery}"`);
          let searchResults: any;
          try {
            searchResults = await yahooFinance.search(searchQuery);
          } catch (searchErr: any) {
            console.error(`Yahoo Search failed for "${searchQuery}":`, searchErr);
            
            // If search fails with BadRequestError (common for Chinese queries), try a cleaner query
            const isBadRequest = searchErr.name === 'BadRequestError' || searchErr.message?.includes('Invalid Search Query');
            
            if (isBadRequest) {
              // Preserve Chinese characters but remove special symbols
              const cleanQuery = searchQuery.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ').trim();
              if (cleanQuery && cleanQuery !== searchQuery) {
                console.log(`Retrying Yahoo Search with cleaned query: "${cleanQuery}"`);
                try {
                  searchResults = await yahooFinance.search(cleanQuery);
                } catch (retryErr) {
                  console.error(`Yahoo Search retry failed for "${cleanQuery}":`, retryErr);
                  continue;
                }
              } else {
                continue;
              }
            } else {
              continue;
            }
          }
          
          if (searchResults.quotes && searchResults.quotes.length > 0) {
            // Find the best match for the requested market strictly
            const bestMatch = searchResults.quotes.find((q: any) => {
              const symMatch = (q.symbol || '').toUpperCase();
              if (market === 'A-Share') return symMatch.endsWith('.SS') || symMatch.endsWith('.SZ') || symMatch.endsWith('.BJ');
              if (market === 'HK-Share') return symMatch.endsWith('.HK');
              if (market === 'US-Share') return !symMatch.endsWith('.SS') && !symMatch.endsWith('.SZ') && !symMatch.endsWith('.BJ') && !symMatch.endsWith('.HK');
              return true;
            });
            
            if (bestMatch) {
              console.log(`Search found best match: ${bestMatch.symbol} for ${searchQuery}`);
              try {
                result = await yahooFinance.quote(bestMatch.symbol as any);
                if (result) break; // Found it!
              } catch (quoteErr) {
                console.error(`Quote failed for search match ${bestMatch.symbol}:`, quoteErr);
              }
            }
          }
        }
      }
      
      if (!result) {
        return res.status(404).json({ error: `无法找到股票代码或简称 "${symbol}" 的相关数据，请检查后重试。` });
      }

      // Robustness check for changePercent (Yahoo sometimes returns decimal like 0.0118 instead of 1.18)
      let changePercent = result.regularMarketChangePercent;
      let change = result.regularMarketChange;
      const price = result.regularMarketPrice;
      const prevClose = result.regularMarketPreviousClose;

      // Fallback calculations
      if (change === undefined && price !== undefined && prevClose !== undefined) {
        change = price - prevClose;
      }
      if (changePercent === undefined && change !== undefined && prevClose !== undefined && prevClose !== 0) {
        changePercent = (change / prevClose) * 100;
      }

      if (changePercent !== undefined && Math.abs(changePercent) < 0.1 && changePercent !== 0 && change !== undefined && price !== undefined) {
        // If changePercent is very small but change is significant, it's likely a decimal
        if (Math.abs(change) > 0.005 * price) {
          changePercent = changePercent * 100;
        }
      }
      
      // Format last updated time
      const dataTime = result.regularMarketTime ? new Date(result.regularMarketTime) : new Date();
      const formattedTime = dataTime.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' CST';

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
        lastUpdated: formattedTime,
        source: 'Yahoo Finance API',
        exchange: result.fullExchangeName || result.exchange,
        marketState: result.marketState,
        quoteDelay: result.exchangeDataDelayedBy || 0
      });
    } catch (error) {
      console.error('Yahoo Finance Error:', error);
      res.status(500).json({ error: 'Failed to fetch real-time stock data', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    addLogEntry('server', 'startup', 'active', 'Server started and background tasks initialized');
  });
}

startServer();
