import { create } from "zustand";
import { IInstrument } from "./types";
import { immer } from 'zustand/middleware/immer';

export interface IStockData {
  stocks: Record<string,
    {
      name: string;
      instruments: Record<string, IInstrument>;
    }>;
}

export const useStockData = create<IStockData>()(immer(() => {
  return {
    stocks: {}
  }
}
));

export const connectWebSocket = () => {
  const ws = new WebSocket("ws://localhost:5000");
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data); console.log("WebSocket message:", message);

    if (message.event === "updateStockData") {
      useStockData.setState((state) => {
        const symbol = message.stockData.data.symbol;
        if (!state.stocks[symbol]) {
          state.stocks[symbol] = { name: symbol, instruments: { [message.stockData.exchangeInstrumentID]: message.stockData } };
        } else {
          state.stocks[symbol].instruments[message.stockData
          ] = message.stockData;
        }
      });
    }
  };

  ws.onopen = () => console.log("Connected to WebSocket");
  ws.onclose = () => console.log("Disconnected from WebSocket");
  ws.onerror = (err) => console.error("WebSocket error", err);
}
