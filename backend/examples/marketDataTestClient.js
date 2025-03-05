//Accessing the XtsMarketDataAPI and XtsMarketDataWS from xts-marketdata-api library
var XtsMarketDataAPI = require("xts-marketdata-api").XtsMarketDataAPI;
var XtsMarketDataWS = require("xts-marketdata-api").WS;
var config = require("./config/config.json");

console.log('step-1')
let secretKey = config.secretKey;
let appKey = config.appKey;
let source = config.source;
let url = config.url;
let userID = null;
let isTradeSymbol = false;
//xtsInteractive for API calls and xtsMarketDataWS for events related functionalities
var xtsMarketDataAPI = null;
var xtsMarketDataWS = null;

console.log('step-2')
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 5000 });
let clients = new Set();

server.on("connection", (ws) => {
  clients.add(ws);

  ws.on("close", () => {
    clients.delete(ws);
  });
});

console.log("step-3")
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

  // Generate market data for 3 instruments of the selected stock
  const subscribedInstruments = instruments.map(
    ({ instrumentID, strikePrice }) => ({
      exchangeInstrumentID: instrumentID, // Static instrument ID
      data: {
        symbol: randomSymbol,
        strikePrice: generateRandomChange(strikePrice, 0.02, 2),
        expiryDate: "2025-06-30",
        Call: {
          LTP: generateRandomChange(strikePrice + 10, 0.02, 2),
          OI: Math.floor(generateRandomChange(100000, 0.05, 0)),
          IV: generateRandomChange(18.5, 0.03, 2),
          ChangeInOI: Math.floor(generateRandomChange(5000, 0.1, 0)),
          volume: Math.floor(generateRandomChange(15000, 0.07, 0)),
          CHNG: generateRandomChange(12, 0.08, 2),
          BidQuantity: Math.floor(generateRandomChange(200, 0.1, 0)),
          BidPrice: generateRandomChange(strikePrice + 9, 0.01, 2),
          AskPrice: generateRandomChange(strikePrice + 11, 0.01, 2),
          AskQuantity: Math.floor(generateRandomChange(250, 0.1, 0)),
        },
        Put: {
          LTP: generateRandomChange(strikePrice - 5, 0.02, 2),
          OI: Math.floor(generateRandomChange(85000, 0.05, 0)),
          IV: generateRandomChange(17.8, 0.03, 2),
          ChangeInOI: Math.floor(generateRandomChange(4800, 0.1, 0)),
          volume: Math.floor(generateRandomChange(12000, 0.07, 0)),
          CHNG: generateRandomChange(-10, 0.08, 2),
          BidQuantity: Math.floor(generateRandomChange(220, 0.1, 0)),
          BidPrice: generateRandomChange(strikePrice - 6, 0.01, 2),
          AskPrice: generateRandomChange(strikePrice - 4, 0.01, 2),
          AskQuantity: Math.floor(generateRandomChange(270, 0.1, 0)),
        },
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

let instrumentIds = [{ stock: "", ids: [] }];
let selectedInstrumentIds = [];

let subscribedInstrument = {
  exchangeInstrumentID: 0,
  data: {
    symbol: "RELIANCE",
    strikePrice: Math.random(),
    expiryDate: "",
    Call: {
      LTP: Math.random(),
      OI: Math.random(),
      IV: Math.random(),
      ChangeInOI: Math.random(),
      volume: Math.random(),
      CHNG: Math.random(),
      BidQuantity: Math.random(),
      BidPrice: Math.random(),
      AskPrice: Math.random(),
      AskQuantity: Math.random(),
    },
    Put: {
      LTP: Math.random(),
      OI: Math.random(),
      IV: Math.random(),
      ChangeInOI: Math.random(),
      volume: Math.random(),
      CHNG: Math.random(),
      BidQuantity: Math.random(),
      BidPrice: Math.random(),
      AskPrice: Math.random(),
      AskQuantity: Math.random(),
    },
  },
};
// setInterval(() => {
//   broadcastMarketData(subscribedInstrument);
// }, 1000);

(async () => {
  xtsMarketDataAPI = new XtsMarketDataAPI(url);
  var loginRequest = {
    secretKey,
    appKey,
  };

  try {
    let logIn = await xtsMarketDataAPI.logIn(loginRequest);
    console.log(logIn, "login");
    if (logIn && logIn.type == xtsMarketDataAPI.responseTypes.success) {
      //creating the instance of xtsMarketDataWS
      userID = logIn.result.userID;
      xtsMarketDataWS = new XtsMarketDataWS(url);
      //Instantiating the socket instance
      var socketInitRequest = {
        userID: logIn.result.userID,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: logIn.result.token, // Token Generated after successful LogIn
      };
      xtsMarketDataWS.init(socketInitRequest);
      //Registering the socket Events
      await registerEvents();
      //calling the remaining methods of the Interactive API
      testAPI();
    } else {
      //In case of failure
      console.error("login ", logIn);
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
          searchString: stock, // Use the actual stock name dynamically
          source: source,
        };

        let response = await searchInstrument(searchInstrumentRequest);
        let ids = response.slice(0, 35); // Select the first 35 instrument
        selectedInstrumentIds.push(...ids);
        return { stock, ids: ids };
      })
    );
    instrumentIds = data.filter((item) => item !== undefined); // Remove undefined values
    instrumentIds = data.flat(); //[33-33-33]

    let instruments = selectedInstrumentIds
      .map((id) => ({
        exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSEFO,
        exchangeInstrumentID: id,
      }))
      .slice(0, 100);

    return instruments;
  } catch (error) {
    console.error("Error fetching instruments:", error);
  }
}

async function testAPI() {
  // get enums of application
  await clientConfig();

  let instruments = await fetchInstruments();

  let subscriptionRequest = {
    instruments: instruments,
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

var searchInstrument = async function (searchInstrumentRequest) {
  try {
    let searchString = searchInstrumentRequest.searchString + " 27MAR2025 CE";

    let response = await xtsMarketDataAPI.searchInstrument(
      searchInstrumentRequest
    );
    const result = response.result;

    // E.x. Filter for Reliance call options expiring on 27MAR2025
    const filteredInstruments = result.filter((item) =>
      item.DisplayName.includes(searchString)
    );
    // Sort the strike prices in ascending order
    const sortedCEStrikePrices = filteredInstruments
      .sort((a, b) => a.StrikePrice - b.StrikePrice)
      .map((item) => item.ExchangeInstrumentID);

    return sortedCEStrikePrices;
  } catch (error) {
    console.error("Error searching instruments:", error);
    throw error; // Re-throw the error after logging
  }
};

var clientConfig = async function () {
  let response = await xtsMarketDataAPI.clientConfig();
  return response;
};

var logOut = async function () {
  let response = await xtsMarketDataAPI.logOut();
  console.log(response);
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
    Object.keys(marketDepthData, "keys");
    if (marketDepthData && marketDepthData.ExchangeInstrumentID) {
      let stockName = instrumentIds.find((item) =>
        item.ids.includes(marketDepthData.ExchangeInstrumentID)
      );

      if (stockName) {
        subscribedInstrument.data.symbol = stockName.stock;
        subscribedInstrument.exchangeInstrumentID =
          marketDepthData.ExchangeInstrumentID;
        subscribedInstrument.data.strikePrice = marketDepthData.StrikePrice;
        subscribedInstrument.data.expiryDate = marketDepthData.ExpiryDate;
        if (marketDepthData.OptionType === "CE") {
          subscribedInstrument.data.Call.LTP =
            marketDepthData.Touchline.LastTradedPrice;
          // subscribedInstrument.data.Call.OI = marketDepthData.OpenInterest;
          // subscribedInstrument.data.Call.IV = marketDepthData.ImpliedVolatility;
          // subscribedInstrument.data.Call.ChangeInOI = marketDepthData.ChangeInOpenInterest;
          subscribedInstrument.data.Call.volume =
            marketDepthData.Touchline.TotalTradedQuantity;
          subscribedInstrument.data.Call.CHNG =
            marketDepthData.Touchline.PercentChange;
          subscribedInstrument.data.Call.BidQuantity =
            marketDepthData.Touchline.BidInfo.Size;
          subscribedInstrument.data.Call.BidPrice =
            marketDepthData.Touchline.BidInfo.Price;
          subscribedInstrument.data.Call.AskPrice =
            marketDepthData.Touchline.AskInfo.Price;
          subscribedInstrument.data.Call.AskQuantity =
            marketDepthData.Touchline.AskInfo.Size;
        } else if (marketDepthData.OptionType === "PE") {
          subscribedInstrument.data.Put.LTP =
            marketDepthData.Touchline.LastTradedPrice;
          // subscribedInstrument.data.Put.OI = marketDepthData.OpenInterest;
          // subscribedInstrument.data.Put.IV = marketDepthData.ImpliedVolatility;
          // subscribedInstrument.data.Put.ChangeInOI = marketDepthData.ChangeInOpenInterest;
          subscribedInstrument.data.Put.volume =
            marketDepthData.Touchline.TotalTradedQuantity;
          subscribedInstrument.data.Put.CHNG =
            marketDepthData.Touchline.PercentChange;
          subscribedInstrument.data.Put.BidQuantity =
            marketDepthData.Touchline.BidInfo.Size;
          subscribedInstrument.data.Put.BidPrice =
            marketDepthData.Touchline.BidInfo.Price;
          subscribedInstrument.data.Put.AskPrice =
            marketDepthData.Touchline.AskInfo.Price;
          subscribedInstrument.data.Put.AskQuantity =
            marketDepthData.Touchline.AskInfo.Size;
        }

        const message = JSON.stringify({
          event: "updateStockData",
          stockData: [subscribedInstrument],
        });

        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });
  // //"logout" event listener
  xtsMarketDataWS.onLogout((logoutData) => {
    console.log(logoutData);
  });
};
