var XtsMarketDataAPI = require("xts-marketdata-api").XtsMarketDataAPI;
var XtsMarketDataWS = require("xts-marketdata-api").WS;
var config = require("./config/config.json");
var bs = require("black-scholes");

let secretKey = config.secretKey;
let appKey = config.appKey;
let source = config.source;
let url = config.url;
let userID = null;

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

    await Promise.all(
      stockList.map(async (stock) => {
        let searchInstrumentRequest = {
          searchString: stock,
          source: source,
        };

        let optionType = ["CE", "PE"];
        optionType.forEach(async (type) => {
          let response = await searchInstrument(searchInstrumentRequest, type);
          console.log(response, "response");
          
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
  console.log(subscriptionRequest, "subscriptionRequest");
  
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

function blackScholesPrice(s, k, t, v, r, callPut) {
  const d1 = (Math.log(s / k) + (r + (v ** 2) / 2) * t) / (v * Math.sqrt(t));
  const d2 = d1 - v * Math.sqrt(t);
  const N = (x) => (1 + Math.erf(x / Math.sqrt(2))) / 2; // CDF of standard normal

  if (callPut === "call") {
    return s * N(d1) - k * Math.exp(-r * t) * N(d2);
  } else {
    return k * Math.exp(-r * t) * N(-d2) - s * N(-d1);
  }
}

function calculateIV(currentPrice, strikePrice, expirationTime, marketPrice, optionType) {
  let time = expirationTime / 365;
  let riskFreeInterest = 0.07
  let type = optionType == 3 ? "call" : "put";

  let v = 0.3;  // Initial guess (30% volatility)
  let epsilon = 1e-6;
  let maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    let price = blackScholesPrice(currentPrice, strikePrice, time, v, riskFreeInterest, type);
    let vega = (s * Math.exp(-0.5 * v * v * t) * Math.sqrt(t)) / Math.sqrt(2 * Math.PI); // Approximation of Vega

    let diff = price - marketPrice;
    if (Math.abs(diff) < epsilon) return v;

    v -= diff / vega;

    if (v <= 0) v = 0.0001;
  }
  console.log(v, 'result');

  return v;

  // return result;
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
      const marketPrice = (marketDepthData.Touchline?.BidInfo.Price || 0 + marketDepthData.Touchline?.AskInfo.Price || 0) / 2;

      let impliedVolatility = calculateIV(
        marketDepthData.Touchline?.LastTradedPrice,
        stockEntry.StrikePrice,
        stockEntry.RemainingExpiryDays,
        marketPrice,
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
        const message = JSON.stringify({
          event: "updateStockData",
          stockData: [instrumentData],
        });

        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });

  //"logout" event listener

  xtsMarketDataWS.onLogout((logoutData) => {
    console.log(logoutData);
  });
};

// // To work on dummy data
// const broadcastMarketData = () => {
//   const symbols = ["RELIANCE", "HDFC", "TCS"];
//   const optionTypes = [3, 4];

//   const instrumentData = {
//     RELIANCE: Array.from({ length: 5 }, (_, i) => ({ instrumentID: 1001 + i, strikePrice: 2400 + i * 50 })),
//     HDFC: Array.from({ length: 5 }, (_, i) => ({ instrumentID: 2001 + i, strikePrice: 1600 + i * 25 })),
//     TCS: Array.from({ length: 5 }, (_, i) => ({ instrumentID: 3001 + i, strikePrice: 3400 + i * 50 })),
//   };

//   const generateRandomChange = (base, percentage = 0.02, decimalPlaces = 0) => {
//     const change = base * (1 + (Math.random() * 2 - 1) * percentage);
//     return Math.round(change);
//   };

//   const generateDummyData = () => {
//     return symbols.flatMap((symbol) => {
//       return instrumentData[symbol].flatMap(({ instrumentID, strikePrice }) => {
//         return optionTypes.map((optionType, index) => {
//           return {
//             exchangeInstrumentID: instrumentID * 10 + index, // Unique ID for CALL and PUT
//             symbol,
//             strikePrice,
//             expiryDate: "2025-06-30",
//             optionType,
//             data: {
//               LTP: generateRandomChange(strikePrice + 10, 0.02, 0),
//               IV: generateRandomChange(30, 0.05, 2),
//               Volume: Math.floor(generateRandomChange(15000, 0.07, 0)),
//               CHNG: generateRandomChange(12, 0.08, 2),
//               BID: generateRandomChange(strikePrice + 9, 0.01, 0),
//               ASK: generateRandomChange(strikePrice + 11, 0.01, 0),
//               BidQuantity: Math.floor(generateRandomChange(200, 0.1, 0)),
//               AskQuantity: Math.floor(generateRandomChange(250, 0.1, 0)),
//             },
//           };
//         });
//       });
//     });
//   };

//   const stockData = generateDummyData();

//   const message = JSON.stringify({
//     event: "updateStockData",
//     stockData,
//   });

//   clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(message);
//     }
//   });
// };


// setInterval(() => {
//   broadcastMarketData();
// }, 1000);
