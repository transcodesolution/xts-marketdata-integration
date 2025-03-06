export interface IInstrument {
  exchangeInstrumentID: string;
  data: OptionMetrics;
}
export interface OptionMetrics {
  CHNG: number;          // Change in Price
  BID: number;           // Bid Price
  ASK: number;           // Ask Price
  BidQuantity: number;   // Bid Quantity
  AskQuantity: number;   // Ask Quantity
  Volume: number;        // Trading Volume
  IV: number;            // Implied Volatility
  LTP: number;           // Last Traded Price
}
