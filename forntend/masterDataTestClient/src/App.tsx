import './App.css';
import { StockDataTable } from './pages/stockDataTable';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import 'mantine-datatable/styles.layer.css';
import '@mantine/core/styles.layer.css';

function App() {

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider defaultColorScheme="auto"><StockDataTable /></MantineProvider>
    </>
  )
}

export default App
