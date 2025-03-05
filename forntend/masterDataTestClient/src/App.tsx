import { StockDataTable } from './pages/stockDataTable';
import { Container, createTheme, MantineProvider, rem } from '@mantine/core';
import 'mantine-datatable/styles.layer.css';
import '@mantine/core/styles.layer.css';

const CONTAINER_SIZES: Record<string, number> = {
  xxs: 300,
  xs: 400,
  sm: 500,
  md: 600,
  lg: 700,
  xl: 800,
  xxl: 1800,
};

function App() {
  const theme = createTheme({
    components: {
      Container: Container.extend({
        vars: (_, { size, fluid }) => ({
          root: {
            '--container-size': fluid
              ? '100%'
              : size !== undefined && size in CONTAINER_SIZES
                ? rem(CONTAINER_SIZES[size])
                : rem(size),
          },
        }),
      }),
    },
  });
  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}><StockDataTable /></MantineProvider>
  )
}

export default App
