import { Box, Title, useMantineTheme } from "@mantine/core";
import { IInstrument } from "../../store/types"
import { DataTable, DataTableColumn } from "mantine-datatable";
import { useStockData } from "../../store/useStockData";
import { memo } from "react";

interface IOptionDataTable {
  stockSymbol: string
}

export const OptionDataTable = memo(({ stockSymbol }: IOptionDataTable) => {
  const { stocks } = useStockData();
  const stock = stocks[stockSymbol];
  const theme = useMantineTheme();


  const columns: DataTableColumn<IInstrument>[] = [
    // CALL SIDE
    { accessor: "data.Call.OI", title: "OI" },
    { accessor: "data.Call.ChangeInOI", title: "Chng in OI" },
    { accessor: "data.Call.volume", title: "Volume" },
    { accessor: "data.Call.IV", title: "IV" },
    { accessor: "data.Call.LTP", title: "LTP" },
    { accessor: "data.Call.CHNG", title: "Chng" },
    { accessor: "data.Call.BidQuantity", title: "Bid Qty" },
    { accessor: "data.Call.BidPrice", title: "Bid" },
    { accessor: "data.Call.AskPrice", title: "Ask" },
    { accessor: "data.Call.AskQuantity", title: "Ask Qty" },

    // STRIKE PRICE (Middle Column)
    {
      accessor: "data.strikePrice",
      title: "Strike",
      cellsStyle: () => ({
        color: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[1],
      }),
      width: "125px",
    },

    // PUT SIDE
    { accessor: "data.Put.BidQuantity", title: "Bid Qty" },
    { accessor: "data.Put.BidPrice", title: "Bid" },
    { accessor: "data.Put.AskPrice", title: "Ask" },
    { accessor: "data.Put.AskQuantity", title: "Ask Qty" },
    { accessor: "data.Put.CHNG", title: "Chng" },
    { accessor: "data.Put.LTP", title: "LTP" },
    { accessor: "data.Put.IV", title: "IV" },
    { accessor: "data.Put.volume", title: "Volume" },
    { accessor: "data.Put.ChangeInOI", title: "Chng in OI" },
    { accessor: "data.Put.OI", title: "OI" },
  ];

  const records = Object.values(stock.instruments);
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