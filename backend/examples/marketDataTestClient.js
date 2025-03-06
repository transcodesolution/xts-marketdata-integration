var XtsMarketDataAPI = require("xts-marketdata-api").XtsMarketDataAPI;
var XtsMarketDataWS = require("xts-marketdata-api").WS;
var config = require("./config/config.json");
var bs = require("black-scholes");

let secretKey = config.secretKey;
let appKey = config.appKey;
let source = config.source;
let url = config.url;
let userID = null;
let isTradeSymbol = false;

//xtsInteractive for API calls and xtsMarketDataWS for events related functionalities
var xtsMarketDataAPI = null;
var xtsMarketDataWS = null;

const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 5000 });
let clients = new Set();

server.on("connection", (ws) => {
  clients.add(ws);

  ws.on("close", () => {
    clients.delete(ws);
  });
});

var instruments = {};

(async () => {
  xtsMarketDataAPI = new XtsMarketDataAPI(url);
  var loginRequest = {
    secretKey,
    appKey,
  };

  try {
    let logIn = await xtsMarketDataAPI.logIn(loginRequest);
    if (logIn && logIn.type == xtsMarketDataAPI.responseTypes.success) {
      userID = logIn.result.userID;
      xtsMarketDataWS = new XtsMarketDataWS(url);

      var socketInitRequest = {
        userID: logIn.result.userID,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: logIn.result.token,
      };

      xtsMarketDataWS.init(socketInitRequest);

      await registerEvents();

      testAPI();
    } else {
      console.error("Login Time Error ", logIn);
    }
  } catch (error) {
    console.log(error, "error");
  }
})();

async function fetchInstruments() {
  try {
    let stockList = ["RELIANCE", "TCS", "NHPC"];

    let data = await Promise.all(
      stockList.map(async (stock) => {
        let searchInstrumentRequest = {
          searchString: stock,
          source: source,
        };

        let optionType = ["CE", "PE"];
        optionType.forEach(async (type) => {
          let response = await searchInstrument(searchInstrumentRequest, type);

          let avgstrikePrice = [];
          response.forEach((id) => {
            avgstrikePrice.push(id.StrikePrice);
          });

          let avgIndex = Math.ceil(avgstrikePrice.length / 2); // Find the middle           
          let belowAvg = avgstrikePrice.slice(0, avgIndex).slice(-8); // Get last 16 from the first half
          let aboveAvg = avgstrikePrice.slice(avgIndex, avgstrikePrice.length).slice(0, 8); // Get first 16 from second half
          let selectedInstruments = [...belowAvg, ...aboveAvg];

          let searchedInstruments = response.filter((instrument) =>
            selectedInstruments.includes(instrument.StrikePrice)
          );

          searchedInstruments.forEach((instrument) => {
            instruments[instrument.ExchangeInstrumentID] = instrument;
          })
        })
      })
    );

    return Object.keys(instruments)
      .map((id) => ({
        exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSEFO,
        exchangeInstrumentID: id,
      }))
      .slice(0, 100);

  } catch (error) {
    console.error("Error fetching instruments:", error);
  }
}

async function testAPI() {
  // get enums of application
  await clientConfig();

  let fetchInstrumentsData = await fetchInstruments();

  let subscriptionRequest = {
    instruments: fetchInstrumentsData,
    xtsMessageCode: 1502,
  };
  // subscribe instrument to get market data
  await subscription(subscriptionRequest);
  // await logOut();
}

var subscription = async function (subscriptionRequest) {
  response = await xtsMarketDataAPI.subscription(subscriptionRequest);
  return response;
};

var searchInstrument = async function (searchInstrumentRequest, optionType) {
  try {
    let stockString = searchInstrumentRequest.searchString + " 27MAR2025 " + optionType;

    let response = await xtsMarketDataAPI.searchInstrument(
      searchInstrumentRequest
    );
    const result = response.result;

    // E.x. Filter for Reliance call options expiring on 27MAR2025
    const filteredInstrumentsCE = result.filter((item) =>
      item.DisplayName.includes(stockString)
    );
    // Sort the strike prices in ascending order
    const sortedCEStrikePrices = filteredInstrumentsCE
      .sort((a, b) => a.StrikePrice - b.StrikePrice)
      .map((item) => item);

    return sortedCEStrikePrices;
  } catch (error) {
    console.error("Error searching instruments:", error);
    throw error; // Re-throw the error after logging
  }
};

const lastTradedPrices = [];

function calculateVolatility(prices) {
  let logReturns = [];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > 0 && prices[i - 1] > 0) { // Avoid division by zero
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }

  if (logReturns.length === 0) return 0; // Avoid NaN if all values are zero

  let meanReturn = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;

  let variance = logReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (logReturns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}

function calculateIV(currentPrice, strikePrice, expirationTime, HistoryPriceArray, optionType) {
  let time = expirationTime / 365;
  let riskFreeInterest = 0.07
  let volatility = parseFloat(calculateVolatility(HistoryPriceArray).toFixed(2));

  let num = bs.blackScholes(currentPrice, strikePrice, time, volatility, riskFreeInterest, "call");
  let result = parseFloat(num.toFixed(2));

  return result;
}

var clientConfig = async function () {
  let response = await xtsMarketDataAPI.clientConfig();
  return response;
};

var logOut = async function () {
  let response = await xtsMarketDataAPI.logOut();
  // console.log(response);
  return response;
};

var registerEvents = async function () {
  xtsMarketDataWS.onConnect((connectData) => {
    // console.log("connectData", connectData);
  });
  //"joined" event listener
  xtsMarketDataWS.onJoined((joinedData) => {
    // console.log("joinedData", joinedData);
  });

  xtsMarketDataWS.onError((errorData) => {
    console.log("errorData", errorData);
  });

  xtsMarketDataWS.onDisconnect((disconnectData) => {
    console.log("disconnectData", disconnectData);
  });

  xtsMarketDataWS.onMarketDepthEvent((marketDepthData) => {

    if (marketDepthData && marketDepthData.ExchangeInstrumentID) {
      let stockEntry = instruments[marketDepthData.ExchangeInstrumentID];
      lastTradedPrices.push(marketDepthData.Touchline?.LastTradedPrice);

      let impliedVolatility = calculateIV(
        marketDepthData.Touchline?.LastTradedPrice,
        stockEntry.StrikePrice,
        stockEntry.RemainingExpiryDays,
        lastTradedPrices,
        stockEntry.OptionType,
      );
      console.log(stockEntry, "stockEntry");
      if (stockEntry) {
        let instrumentData = {
          symbol: stockEntry.Name,
          strikePrice: stockEntry.StrikePrice || 0, // Default to 0 if missing
          expiryDate: stockEntry.ContractExpirationString || "",
          optionType: stockEntry.OptionType,
          exchangeInstrumentID: marketDepthData.ExchangeInstrumentID,
          data: {
            LTP: marketDepthData.Touchline?.LastTradedPrice || 0,
            IV: impliedVolatility || 0,
            Volume: marketDepthData.Touchline?.TotalTradedQuantity || 0,
            CHNG: marketDepthData.Touchline?.PercentChange || 0,
            BID: marketDepthData.Touchline?.BidInfo?.Price || 0,
            ASK: marketDepthData.Touchline?.AskInfo?.Price || 0,
            BidQuantity: marketDepthData.Touchline?.BidInfo?.Size || 0,
            AskQuantity: marketDepthData.Touchline?.AskInfo?.Size || 0,
          },
        };

        // Send as an array since the frontend expects IInstrument[]
        // const message = JSON.stringify({
        //   event: "updateStockData",
        //   stockData: [instrumentData],
        // });

        // clients.forEach((client) => {
        //   if (client.readyState === WebSocket.OPEN) {
        //     client.send(message);
        //   }
        // });
      }
    }
  });

  //"logout" event listener

  xtsMarketDataWS.onLogout((logoutData) => {
    console.log(logoutData);
  });
};

// To work on dummy data
const broadcastMarketData = () => {
  const symbols = ["RELIANCE", "HDFC", "TCS", "ICICI"];

  // Static instrument IDs per stock with 3 variations (e.g., strike price variations)
  const instrumentData = {
    RELIANCE: [
      { instrumentID: 1001, strikePrice: 2500 },
      { instrumentID: 1002, strikePrice: 2550 },
      { instrumentID: 1003, strikePrice: 2600 },
    ],
    HDFC: [
      { instrumentID: 2001, strikePrice: 1700 },
      { instrumentID: 2002, strikePrice: 1725 },
      { instrumentID: 2003, strikePrice: 1750 },
    ],
    TCS: [
      { instrumentID: 3001, strikePrice: 3500 },
      { instrumentID: 3002, strikePrice: 3550 },
      { instrumentID: 3003, strikePrice: 3600 },
    ],
    ICICI: [
      { instrumentID: 4001, strikePrice: 900 },
      { instrumentID: 4002, strikePrice: 925 },
      { instrumentID: 4003, strikePrice: 950 },
    ],
  };

  const generateRandomChange = (base, percentage = 0.02, decimalPlaces = 2) => {
    const change = base * (1 + (Math.random() * 2 - 1) * percentage);
    return parseFloat(change.toFixed(decimalPlaces));
  };

  // Randomly select a stock
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const instruments = instrumentData[randomSymbol];

  let impliedVolatility = calculateIV(
    generateRandomChange(180, 0.02, 2),
    generateRandomChange(3500, 0.02, 2),
    23,
    [Math.floor(generateRandomChange(5000, 0.1, 0)), Math.floor(generateRandomChange(5000, 0.1, 0)), Math.floor(generateRandomChange(5000, 0.1, 0)), Math.floor(generateRandomChange(5000, 0.1, 0)),],
    "call"
  );
  console.log(impliedVolatility, "impliedVolatility");

  // Generate market data for 3 instruments of the selected stock
  const subscribedInstruments = instruments.map(
    ({ instrumentID, strikePrice }) => ({
      exchangeInstrumentID: instrumentID, // Static instrument ID
      symbol: randomSymbol,
      strikePrice: generateRandomChange(strikePrice, 0.02, 2),
      expiryDate: "2025-06-30",
      data: {
        LTP: generateRandomChange(strikePrice + 10, 0.02, 2),
        IV: impliedVolatility,
        volume: Math.floor(generateRandomChange(15000, 0.07, 0)),
        CHNG: generateRandomChange(12, 0.08, 2),
        BidQuantity: Math.floor(generateRandomChange(200, 0.1, 0)),
        BID: generateRandomChange(strikePrice + 9, 0.01, 2),
        ASK: generateRandomChange(strikePrice + 11, 0.01, 2),
        AskQuantity: Math.floor(generateRandomChange(250, 0.1, 0)),
      },
    })
  );

  const message = JSON.stringify({
    event: "updateStockData",
    stockData: subscribedInstruments,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
setInterval(() => {
  broadcastMarketData();
}, 1000);
