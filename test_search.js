import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const symbol = '阳光电源';
    console.log(`Searching for: ${symbol}`);
    const results = await yahooFinance.search(symbol);
    console.log('Search results count:', results.quotes.length);
    
    if (results.quotes && results.quotes.length > 0) {
      const bestMatch = results.quotes[0];
      console.log(`Best match symbol: ${bestMatch.symbol}`);
      const quote = await yahooFinance.quote(bestMatch.symbol);
      console.log('Quote symbol:', quote.symbol);
      console.log('Quote price:', quote.regularMarketPrice);
    } else {
      console.log('No quotes found in search results');
    }
  } catch (err) {
    console.error('Error Status:', err.status);
    console.error('Error Message:', err.message);
    if (err.errors) {
      console.error('Detailed Errors:', JSON.stringify(err.errors, null, 2));
    }
  }
}

test();
