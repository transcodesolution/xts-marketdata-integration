import { create } from "zustand";
import { IInstrument } from "./types";
import { immer } from "zustand/middleware/immer";

export interface IStockData {
  stocks: Record<string, {
    name: string;
    strikePrice: number;
    expiryDate: string;
    call: Record<string, IInstrument>;
    put: Record<string, IInstrument>;
  }>;
  sortedStockKeys: string[]
}

export const useStockData = create<IStockData>()(immer(() => ({
  stocks: {},
  sortedStockKeys: [] as string[]
})));

export const connectWebSocket = () => {
  const ws = new WebSocket("ws://localhost:5000");

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("WebSocket message:", message);

    if (message.event === "updateStockData" && Array.isArray(message.stockData)) {
      useStockData.setState((state) => {
        message.stockData.forEach((stock: any) => {
          const symbol = stock.symbol;
          const instrumentId = stock.exchangeInstrumentID;

          if (!state.stocks[symbol]) {
            state.stocks[symbol] = {
              name: symbol,
              strikePrice: stock.strikePrice,
              expiryDate: stock.expiryDate,
              call: {},
              put: {},
            };
          } 
          
          if (stock.optionType === 3) {
            // CE (Call Option)
            state.stocks[symbol].call[instrumentId] = {
              exchangeInstrumentID: instrumentId,
              data: stock.data,
            };
          } else if (stock.optionType === 4) {
            // PE (Put Option)
            state.stocks[symbol].put[instrumentId] = {
              exchangeInstrumentID: instrumentId,
              data: stock.data,
            };
          }
        });

        // 🔥 Sorting logic: Sort stocks based on the IV of the first instrument
        state.sortedStockKeys = Object.keys(state.stocks).sort((a, b) => {
          const firstInstrumentA = Object.values(state.stocks[a].call)[0];
          const firstInstrumentB = Object.values(state.stocks[b].call)[0];

          const ivA = firstInstrumentA?.data?.IV ?? 0;
          const ivB = firstInstrumentB?.data?.IV ?? 0;

          return ivB - ivA;  // Descending order (Higher IV first)
        });
      });
    }
  };

  ws.onopen = () => console.log("Connected to WebSocket");
  ws.onclose = () => console.log("Disconnected from WebSocket");
  ws.onerror = (err) => console.error("WebSocket error", err);
};
