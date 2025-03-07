import { Box, Title, useMantineTheme } from "@mantine/core";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { useStockData } from "../../store/useStockData";
import { memo } from "react";

interface IOptionDataTable {
  stockSymbol: string
}

export const OptionDataTable = memo(({ stockSymbol }: IOptionDataTable) => {
  const { stocks } = useStockData();
  const stockData = stocks[stockSymbol];

  const theme = useMantineTheme();


  const columns: DataTableColumn<{
    strikePrice: number;
    call: {};
    put: {};
  }>[] = [
      // CALL SIDE
      { accessor: "call.Volume", title: "Volume" },
      { accessor: "call.IV", title: "IV" },
      { accessor: "call.LTP", title: "LTP" },
      { accessor: "call.CHNG", title: "Chng" },
      { accessor: "call.BidQuantity", title: "Bid Qty" },
      { accessor: "call.BID", title: "Bid" },
      { accessor: "call.ASK", title: "Ask" },
      { accessor: "call.AskQuantity", title: "Ask Qty" },

      // STRIKE PRICE (Middle Column)
      {
        accessor: "strikePrice",
        title: "Strike Price",
        cellsStyle: () => ({
          color: theme.colors.blue[6],
          backgroundColor: theme.colors.blue[1],
        }),
        width: "125px",
      },

      // PUT SIDE
      { accessor: "put.BidQuantity", title: "Bid Qty" },
      { accessor: "put.BID", title: "Bid" },
      { accessor: "put.ASK", title: "Ask" },
      { accessor: "put.AskQuantity", title: "Ask Qty" },
      { accessor: "put.CHNG", title: "Chng" },
      { accessor: "put.LTP", title: "LTP" },
      { accessor: "put.IV", title: "IV" },
      { accessor: "put.Volume", title: "Volume" },
    ];

  const records = Object.entries(stockData).map(([strikePrice, data]) => ({
    strikePrice: Number(strikePrice),
    call: data.call?.data || {},
    put: data.put?.data || {}
  }));

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