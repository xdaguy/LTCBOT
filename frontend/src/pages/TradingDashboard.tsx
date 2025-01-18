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
  SimpleGrid,
  Flex,
  Badge,
  Divider
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
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [emaShort, setEmaShort] = useState<number | null>(null);
  const [emaLong, setEmaLong] = useState<number | null>(null);
  const [chartData15m, setChartData15m] = useState<any[]>([]);
  const [chartData1h, setChartData1h] = useState<any[]>([]);
  const [chartData1m, setChartData1m] = useState<any[]>([]);

  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/price');
        if (price !== null) {
          setPrevPrice(price);
        }
        setPrice(response.data.price);
        setSignal(response.data.signal);
        setEmaShort(response.data.ema_short);
        setEmaLong(response.data.ema_long);
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
  }, [price]);

  // Calculate price change direction
  const priceChange = price && prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
  const priceDirection = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';

  // Mock RSI calculation (replace with actual RSI when available)
  const getRSI = () => {
    if (!chartData1m.length) return null;
    const lastFewPrices = chartData1m.slice(-14).map(d => d.value);
    const gains = lastFewPrices.map((price, i) => 
      i > 0 ? Math.max(price - lastFewPrices[i-1], 0) : 0
    ).slice(1);
    const losses = lastFewPrices.map((price, i) => 
      i > 0 ? Math.abs(Math.min(price - lastFewPrices[i-1], 0)) : 0
    ).slice(1);
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    
    if (avgLoss === 0) return 100;
    const RS = avgGain / avgLoss;
    return 100 - (100 / (1 + RS));
  };

  const rsi = getRSI();
  const rsiColor = rsi ? (rsi > 70 ? 'red.500' : rsi < 30 ? 'green.500' : 'gray.500') : 'gray.500';

  return (
    <VStack spacing={4} align="stretch" p={4} bg="gray.900" minH="100vh">
      {/* Price and Signal Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={mutedTextColor}>LTC-USDT Price</Text>
              <HStack spacing={2}>
                <Text fontSize="2xl" color={textColor}>${price?.toFixed(2) || '-.--'}</Text>
                {priceChange !== 0 && (
                  <Badge colorScheme={priceDirection === 'up' ? 'green' : 'red'}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Badge>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={mutedTextColor}>Trading Signal</Text>
              <Badge 
                colorScheme={signal === 'BUY' ? 'green' : signal === 'SELL' ? 'red' : 'gray'}
                fontSize="lg"
                px={3}
                py={1}
              >
                {signal || 'NEUTRAL'}
              </Badge>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={mutedTextColor}>RSI (14)</Text>
              <HStack>
                <Text fontSize="xl" color={rsiColor}>{rsi?.toFixed(1) || '-'}</Text>
                <Badge 
                  colorScheme={rsi ? (rsi > 70 ? 'red' : rsi < 30 ? 'green' : 'gray') : 'gray'}
                >
                  {rsi ? (rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL') : 'N/A'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Indicators Section */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={mutedTextColor}>EMA Indicators</Text>
              <HStack spacing={4} divider={<Divider orientation="vertical" borderColor={borderColor} />}>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color={mutedTextColor}>EMA (7)</Text>
                  <Text fontSize="lg" color="blue.400">{emaShort?.toFixed(2) || '-'}</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color={mutedTextColor}>EMA (25)</Text>
                  <Text fontSize="lg" color="purple.400">{emaLong?.toFixed(2) || '-'}</Text>
                </VStack>
                <Badge colorScheme={emaShort && emaLong ? (emaShort > emaLong ? 'green' : 'red') : 'gray'}>
                  {emaShort && emaLong ? (emaShort > emaLong ? 'BULLISH' : 'BEARISH') : 'N/A'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={mutedTextColor}>Trend Strength</Text>
              <HStack spacing={4}>
                <Badge 
                  colorScheme={
                    emaShort && emaLong && price
                      ? (price > emaShort && emaShort > emaLong ? 'green' 
                        : price < emaShort && emaShort < emaLong ? 'red' 
                        : 'yellow')
                      : 'gray'
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                  variant="solid"
                >
                  {emaShort && emaLong && price
                    ? (price > emaShort && emaShort > emaLong ? 'STRONG UPTREND'
                      : price < emaShort && emaShort < emaLong ? 'STRONG DOWNTREND'
                      : 'CONSOLIDATING')
                    : 'N/A'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts Section */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
        <CardBody pt={2}>
          <Text fontSize="sm" color={mutedTextColor} mb={4}>1 Minute Chart</Text>
          <Box bg={cardBg} borderRadius="md" overflow="hidden">
            <PriceChart data={chartData1m} interval="1m" />
          </Box>
        </CardBody>
      </Card>

      <SimpleGrid columns={2} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody pt={2}>
            <Text fontSize="sm" color={mutedTextColor} mb={4}>15 Minutes Chart</Text>
            <Box bg={cardBg} borderRadius="md" overflow="hidden">
              <PriceChart data={chartData15m} interval="15m" />
            </Box>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody pt={2}>
            <Text fontSize="sm" color={mutedTextColor} mb={4}>1 Hour Chart</Text>
            <Box bg={cardBg} borderRadius="md" overflow="hidden">
              <PriceChart data={chartData1h} interval="1h" />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
};

export default TradingDashboard; 