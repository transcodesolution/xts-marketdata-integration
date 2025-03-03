// const express = require("express");
// const cors = require("cors");
const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 5000 });

let clients = new Set();

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
// app.use(cors({ origin: "http://localhost:5173" })); // Enable CORS for frontend requests
// app.use(express.json()); // Middleware to parse JSON

// wss.on("connection", (ws) => {
//   console.log("New client connected");
//   const interval = setInterval(() => {
//     ws.send(JSON.stringify({ event: "update", data: { price: Math.random() * 100 } }));
//   }, 3000);

//   ws.on("close", () => {
//     console.log("Client disconnected");
//     clearInterval(interval);
//   });
// });

server.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

const broadcastMarketData = (stockData) => {
  const message = JSON.stringify({ event: "updateStockData", stockData });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Example API Endpoint
// app.get("/api/stockData", (req, res) => {
//   const stockData = [

//   ]
//   //   const stockData = [
//   //     {
//   //       "InstrumentId": "154691",
//   //       "data": {
//   //         "symbol": "RELIANCE",
//   //         "expiryDate": "25-06-2020",
//   //         "strikePrice": 1500,
//   //         "Call": {
//   //           "OI": 15000,
//   //           "ChangeInOI": 1000,
//   //           "CHNG": 500,
//   //           "BID": 56.6,
//   //           "ASK": 56.95,
//   //           "BidQuantity": 350,
//   //           "AskQuantity": 175,
//   //           "Volume": 120000,
//   //           "IV": 18.5,
//   //           "LTP": 56.8
//   //         },
//   //         "Put": {
//   //           "OI": 10000,
//   //           "CHNG": -500,
//   //           "BID": 45.6,
//   //           "ChangeInOI": -500,
//   //           "ASK": 45.95,
//   //           "BidQuantity": 250,
//   //           "AskQuantity": 125,
//   //           "Volume": 80000,
//   //           "IV": 18.5,
//   //           "LTP": 45.8
//   //         }
//   //       }
//   //     },
//   //     {
//   //       "InstrumentId": "154692",
//   //       "data": {
//   //         "symbol": "TCS",
//   //         "expiryDate": "25-06-2020",
//   //         "strikePrice": 1600,
//   //         "Call": {
//   //           "OI": 20000,
//   //           "ChangeInOI": 2000,
//   //           "BID": 46.6,
//   //           "CHNG": 1000,
//   //           "ASK": 46.95,
//   //           "BidQuantity": 450,
//   //           "AskQuantity": 225,
//   //           "Volume": 150000,
//   //           "IV": 18.5,
//   //           "LTP": 46.8
//   //         },
//   //         "Put": {
//   //           "OI": 12000,
//   //           "ChangeInOI": -1000,
//   //           "CHNG": -500,
//   //           "BID": 35.6,
//   //           "ASK": 35.95,
//   //           "BidQuantity": 350,
//   //           "AskQuantity": 175,
//   //           "Volume": 100000,
//   //           "IV": 18.5,
//   //           "LTP": 35.8
//   //         }
//   //       }
//   //     }
//   // ]
//   // ;

//   res.json(stockData);
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// server.listen(5000, () => {
//   console.log("WebSocket server running on ws://localhost:5000");
// });