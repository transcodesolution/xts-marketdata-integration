import { connectWebSocket, useStockData } from "../store/useStockData";
import { useEffect } from "react";
import { OptionDataTable } from "../components/option-data-table";
import { Container, Stack } from '@mantine/core';

export const StockDataTable = () => {
  const { stocks, sortedStockKeys } = useStockData();
  console.log("StockDataTable: stockData", stocks);

  useEffect(() => {
    connectWebSocket();
  }, []);

  return (
    <div style={{ width: '100%', margin: 'auto' }}>
      <Container size='xxl' my='auto' style={{ borderRadius: 10, padding: 2 }}>
        <Stack gap='sm'>
          {sortedStockKeys.map((stockSymbol) => <OptionDataTable stockSymbol={stockSymbol} />)}
        </Stack>
      </Container>
    </div>
  );
};
