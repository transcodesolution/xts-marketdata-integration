import { create } from "zustand";
import { IInstrument } from "./types";
import { immer } from "zustand/middleware/immer";

// stocks:{
//   TCS :{
//     2100 :{
//       call:{},
//       put:{}
//     }
//   }
// }
export interface IStockData {
  stocks: Record<string, Record<string, {
    call?: IInstrument;
    put?: IInstrument
  }>>;
  sortedStockKeys: string[]
}

export const useStockData = create<IStockData>()(immer(() => ({
  stocks: {},
  sortedStockKeys: [] as string[]
})));

export const connectWebSocket = () => {
  const ws = new WebSocket("ws://localhost:5000");

  ws.onmessage = (event) => {
    const message: {
      event: string;
      stockData: IInstrument[]
    } = JSON.parse(event.data);
    console.log("WebSocket message:", message);

    if (message.event === "updateStockData" && Array.isArray(message.stockData)) {
      useStockData.setState((state) => {
        message.stockData.forEach((stock) => {
          const symbol = stock.symbol;
          const strikePrice = stock.strikePrice;
          const optionType = stock.optionType == 3 ? 'call' : 'put'
          if (!state.stocks[symbol]) {
            state.stocks[symbol] = {
              [strikePrice]: {
                [optionType]: stock.data
              }
            };
          } else {
            if (!state.stocks[symbol][strikePrice]) {
              state.stocks[symbol][strikePrice] = {};
            }
            state.stocks[symbol][strikePrice][optionType] = stock.data;
          }
        });
      });
    }
  };
  ws.onopen = () => console.log("Connected to WebSocket");
  ws.onclose = () => console.log("Disconnected from WebSocket");
  ws.onerror = (err) => console.error("WebSocket error", err);
};
