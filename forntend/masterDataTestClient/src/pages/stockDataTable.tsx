import { DataTable, DataTableColumn } from "mantine-datatable";
import "./stockDataTable.css";
import 'mantine-datatable/styles.layer.css';
import { Container, useMantineTheme } from "@mantine/core";
import { connectWebSocket, useStockData } from "../store/useStockData";
import { useEffect } from "react";
import { IInstrument } from "../store/types";

export const StockDataTable = () => {
  const { stocks } = useStockData();
  const theme = useMantineTheme();
  console.log("StockDataTable: stockData", stocks);

  useEffect(() => {
    connectWebSocket();
  }, []);

  const rows = stocks['RELIANCE']?.instruments ? Object.entries(stocks['RELIANCE']?.instruments)?.map(([_, instrument]) => instrument) : [];

  const columns: DataTableColumn<IInstrument>[] = [
    { accessor: "data.Call.OI", title: "OI" },
    { accessor: "data.Call.ChangeInOI", title: "CHNG IN OI" },
    { accessor: "data.Call.CHNG", title: "CHNG" },
    { accessor: "data.Call.BID", title: "Bid" },
    { accessor: "data.Call.ASK", title: "Ask" },
    { accessor: "data.Call.BidQuantity", title: "BID QTY" },
    { accessor: "data.Call.AskQuantity", title: "ASK QTY" },
    { accessor: "data.Call.LTP", title: "LTP" },
    { accessor: "data.Call.Volume", title: "VOLUME" },
    { accessor: "data.Call.IV", title: "IV" },

    {
      accessor: "data.strikePrice", title: "Strike Price", cellsStyle: () => ({
        color: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[1],
      }),
    },
    {
      accessor: "data.expiryDate", title: "ExpiryDate", cellsStyle: () => ({
        color: theme.colors.blue[6],
        backgroundColor: theme.colors.blue[1],
      }),
    },

    { accessor: "data.Put.BidQuantity", title: "BID QTY" },
    { accessor: "data.Put.BID", title: "Bid" },
    { accessor: "data.Put.ASK", title: "Ask" },
    { accessor: "data.Put.AskQuantity", title: "ASK QTY" },
    { accessor: "data.Put.LTP", title: "LTP" },
    { accessor: "data.Put.IV", title: "IV" },
    { accessor: "data.Put.Volume", title: "VOLUME" },
    { accessor: "data.Put.ChangeInOI", title: "CHNG IN OI" },
    { accessor: "data.Put.OI", title: "OI" },
    { accessor: "data.Put.CHNG", title: "CHNG" },

  ]
  return (
    <Container size='xl' style={{ borderRadius: 10, padding: 2, backgroundColor: "var(--mantine-color-blue-light)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>Stock Data Table</h2>
      <div className="header-container">
        <div className="header-section">CALLS</div>
        <div className="header-section">PUTS</div>
      </div>

      <DataTable
        withColumnBorders
        highlightOnHover
        columns={columns}
        records={rows}
      />
    </Container>
  );
};
