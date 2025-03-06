import { Box, Title, useMantineTheme } from "@mantine/core";
import { IInstrument } from "../../store/types"
import { DataTable, DataTableColumn } from "mantine-datatable";
import { IStockData, useStockData } from "../../store/useStockData";
import { memo } from "react";

interface IOptionDataTable {
  stockSymbol: string
}

export const OptionDataTable = memo(({ stockSymbol }: IOptionDataTable) => {
  const { stocks } = useStockData();
  const stock = stocks[stockSymbol];
  const theme = useMantineTheme();


  const columns: DataTableColumn<IStockData>[] = [
    // CALL SIDE
    { accessor: "stocks.call.OI", title: "OI" },
    { accessor: "stocks.call.ChangeInOI", title: "Chng in OI" },
    { accessor: "stocks.call.Volume", title: "Volume" },
    { accessor: "stocks.call.IV", title: "IV" },
    { accessor: "stocks.call.LTP", title: "LTP" },
    { accessor: "stocks.call.CHNG", title: "Chng" },
    { accessor: "stocks.call.BidQuantity", title: "Bid Qty" },
    { accessor: "stocks.call.BID", title: "Bid" },
    { accessor: "stocks.call.ASK", title: "Ask" },
    { accessor: "stocks.call.AskQuantity", title: "Ask Qty" },

    // STRIKE PRICE (Middle Column)
    {
      accessor: "stocks.strikePrice",
      title: "Strike",
      cellsStyle: () => ({
        color: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[1],
      }),
      width: "125px",
    },

    // PUT SIDE
    { accessor: "stocks.put.BidQuantity", title: "Bid Qty" },
    { accessor: "stocks.put.BID", title: "Bid" },
    { accessor: "stocks.put.ASK", title: "Ask" },
    { accessor: "stocks.put.AskQuantity", title: "Ask Qty" },
    { accessor: "stocks.put.CHNG", title: "Chng" },
    { accessor: "stocks.put.LTP", title: "LTP" },
    { accessor: "stocks.put.IV", title: "IV" },
    { accessor: "stocks.put.Volume", title: "Volume" },
    { accessor: "stocks.put.ChangeInOI", title: "Chng in OI" },
    { accessor: "stocks.put.OI", title: "OI" },
  ];

  const records: IStockData[] = [
    {
      stocks: { [stockSymbol]: stock },
      sortedStockKeys: Object.keys(stock),
    }
  ];
  return (
    <Box bg='cyan'>
      <Title order={2} ta='center' p='md' c='white'>{stockSymbol}</Title>
      <DataTable
        withColumnBorders
        highlightOnHover
        columns={columns}
        records={records}
      />
    </Box>
  )
})