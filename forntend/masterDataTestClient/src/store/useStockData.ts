import { create } from "zustand";
import { IInstrument } from "./types";
import { immer } from "zustand/middleware/immer";

export interface IStockData {
  stocks: Record<string, {
    name: string;
    instruments: Record<string, IInstrument>;
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
        message.stockData.forEach((stock: IInstrument) => {
          const symbol = stock.data.symbol;
          const instrumentId = stock.exchangeInstrumentID;

          if (!state.stocks[symbol]) {
            state.stocks[symbol] = {
              name: symbol,
              instruments: { [instrumentId]: stock }
            };
          } else {
            state.stocks[symbol].instruments[instrumentId] = stock;
          }
        });

        // 🔥 Sorting logic: Sort stocks based on the IV of the first instrument
        state.sortedStockKeys = Object.keys(state.stocks).sort((a, b) => {
          const firstInstrumentA = Object.values(state.stocks[a].instruments)[0];
          const firstInstrumentB = Object.values(state.stocks[b].instruments)[0];

          const ivA = firstInstrumentA?.data?.Call.IV ?? 0;
          const ivB = firstInstrumentB?.data?.Call.IV ?? 0;

          return ivB - ivA;  // Descending order (Higher IV first)
        });
      });
    }
  };

  ws.onopen = () => console.log("Connected to WebSocket");
  ws.onclose = () => console.log("Disconnected from WebSocket");
  ws.onerror = (err) => console.error("WebSocket error", err);
};
