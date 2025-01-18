import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChakraProvider, Box, VStack, Heading, HStack } from '@chakra-ui/react';
import TradingDashboard from './pages/TradingDashboard';
import ControlPanel from './pages/ControlPanel';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="gray.900" py={4}>
          <VStack spacing={6}>
            {/* Navigation */}
            <HStack spacing={6} color="white" mb={4}>
              <Link to="/">Trading Dashboard</Link>
              <Link to="/cp">Control Panel</Link>
            </HStack>
            
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
