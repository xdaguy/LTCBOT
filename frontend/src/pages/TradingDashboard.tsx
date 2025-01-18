import { useQuery } from 'react-query'
import { 
  Box, 
  Grid, 
  GridItem, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  Card, 
  CardBody,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  SimpleGrid
} from '@chakra-ui/react'
import axios from 'axios'
import PriceChart from '../components/PriceChart'
import { useEffect, useState } from 'react'

interface PriceData {
  price: number
  signal?: 'buy' | 'sell' | 'hold'
  ema_short?: number
  ema_long?: number
  chart_data_15m?: Array<{
    time: string
    value: number
  }>
  chart_data_1h?: Array<{
    time: string
    value: number
  }>
  chart_data_1m?: Array<{
    time: string
    value: number
  }>
}

const TradingDashboard = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [chartData15m, setChartData15m] = useState<any[]>([]);
  const [chartData1h, setChartData1h] = useState<any[]>([]);
  const [chartData1m, setChartData1m] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/price');
        console.log('API Response:', response.data);
        setPrice(response.data.price);
        setSignal(response.data.signal);
        setChartData15m(response.data.chart_data_15m || []);
        setChartData1h(response.data.chart_data_1h || []);
        setChartData1m(response.data.chart_data_1m || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <VStack spacing={4} align="stretch" p={4}>
      <HStack justify="space-between" align="center">
        <Box>
          <Text fontSize="lg" fontWeight="bold">LTC-USDT Price</Text>
          <Text fontSize="3xl">${price?.toFixed(2) || '-.--'}</Text>
        </Box>
        <Box>
          <Text fontSize="lg" fontWeight="bold">Signal</Text>
          <Text fontSize="xl" color={signal === 'BUY' ? 'green.500' : signal === 'SELL' ? 'red.500' : 'gray.500'}>
            {signal || 'NEUTRAL'}
          </Text>
        </Box>
      </HStack>

      <SimpleGrid columns={1} spacing={4}>
        <Box>
          <PriceChart data={chartData1m} interval="1m" />
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={2} spacing={4}>
        <Box>
          <PriceChart data={chartData15m} interval="15m" />
        </Box>
        <Box>
          <PriceChart data={chartData1h} interval="1h" />
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

export default TradingDashboard 