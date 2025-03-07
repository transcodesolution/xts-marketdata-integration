import { connectWebSocket, useStockData } from "../store/useStockData";
import { useEffect } from "react";
import { OptionDataTable } from "../components/option-data-table";
import { Container, Stack } from '@mantine/core';

export const StockDataTable = () => {
  const { stocks } = useStockData();

  useEffect(() => {
    connectWebSocket();
  }, []);

  return (
    <div style={{ width: '100%', margin: 'auto' }}>
      <Container size='xxl' my='auto' style={{ borderRadius: 10, padding: 2 }}>
        <Stack gap='sm'>
          {Object.keys(stocks).map((stockSymbol) => <OptionDataTable stockSymbol={stockSymbol} />)}
        </Stack>
      </Container>
    </div>
  );
};
