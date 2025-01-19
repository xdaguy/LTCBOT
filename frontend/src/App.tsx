import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, Box, VStack } from '@chakra-ui/react';
import TradingDashboard from './pages/TradingDashboard';
import ControlPanel from './pages/ControlPanel';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="gray.900" py={4}>
          <VStack spacing={6}>
            {/* Routes */}
            <Routes>
              <Route path="/" element={<TradingDashboard />} />
              <Route path="/cp" element={<ControlPanel />} />
            </Routes>
          </VStack>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
