export interface IInstrument {
  exchangeInstrumentID: string;
  data: OptionDetails;
}

export interface OptionDetails {
  symbol: string;
  expiryDate: string;
  strikePrice: number;
  Call: OptionMetrics;
  Put: OptionMetrics;
}

export interface OptionMetrics {
  OI: number;            // Open Interest
  ChangeInOI: number;    // Change in Open Interest
  CHNG: number;          // Change in Price
  BID: number;           // Bid Price
  ASK: number;           // Ask Price
  BidQuantity: number;   // Bid Quantity
  AskQuantity: number;   // Ask Quantity
  Volume: number;        // Trading Volume
  IV: number;            // Implied Volatility
  LTP: number;           // Last Traded Price
}
