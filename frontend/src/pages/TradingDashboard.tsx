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
import { useEffect, useState, useMemo } from 'react'

interface ApiResponse {
  price: number
  signal: string
  rsi: number
  ema_short: number
  ema_long: number
  timeframe: string
  ema_trend: string
  rsi_status: string
  trend_strength: string
  indicators: {
    rsi_period: number
    ema_short_period: number
    ema_long_period: number
    rsi_overbought: number
    rsi_oversold: number
  }
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
  const [signal, setSignal] = useState<string>('NEUTRAL');
  const [emaShort, setEmaShort] = useState<number | null>(null);
  const [emaLong, setEmaLong] = useState<number | null>(null);
  const [rsi, setRsi] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [emaTrend, setEmaTrend] = useState<string>('NEUTRAL');
  const [rsiStatus, setRsiStatus] = useState<string>('NEUTRAL');
  const [trendStrength, setTrendStrength] = useState<string>('WEAK');
  const [indicators, setIndicators] = useState<ApiResponse['indicators'] | null>(null);
  const [chartData15m, setChartData15m] = useState<any[]>([]);
  const [chartData1h, setChartData1h] = useState<any[]>([]);
  const [chartData1m, setChartData1m] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const response = await axios.get<ApiResponse>('http://localhost:8000/price');
        updateData(response.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateData(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setWsConnected(false);
    };

    // Fetch initial data
    fetchInitialData();

    // Cleanup WebSocket on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const updateData = (data: ApiResponse) => {
    if (data.price !== undefined && data.price !== null) {
      setPrevPrice(price);
      setPrice(data.price);
    }
    
    if (data) {
      setSignal(data.signal || 'NEUTRAL');
      setRsi(typeof data.rsi === 'number' ? data.rsi : null);
      setEmaShort(typeof data.ema_short === 'number' ? data.ema_short : null);
      setEmaLong(typeof data.ema_long === 'number' ? data.ema_long : null);
      setTimeframe(data.timeframe || '15m');
      setEmaTrend(data.ema_trend || 'NEUTRAL');
      if (typeof data.rsi === 'number') {
        if (data.rsi > 70) {
          setRsiStatus('OVERBOUGHT');
        } else if (data.rsi < 30) {
          setRsiStatus('OVERSOLD');
        } else {
          setRsiStatus('NEUTRAL');
        }
      } else {
        setRsiStatus('NEUTRAL');
      }
      setTrendStrength(data.trend_strength || 'WEAK');
      setIndicators(data.indicators || null);
      setChartData15m(data.chart_data_15m || []);
      setChartData1h(data.chart_data_1h || []);
      setChartData1m(data.chart_data_1m || []);
    }
  };

  const priceChange = useMemo(() => {
    if (price === null || prevPrice === null || price === undefined || prevPrice === undefined) {
      return null;
    }
    if (prevPrice === 0) {
      return 0;
    }
    return ((price - prevPrice) / prevPrice) * 100;
  }, [price, prevPrice]);

  const priceDirection = useMemo(() => {
    if (priceChange === null || priceChange === undefined) {
      return 'neutral';
    }
    return priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';
  }, [priceChange]);

  const rsiColor = useMemo(() => {
    if (typeof rsi !== 'number') return 'gray.500';
    if (rsi > 70) return 'red.500';
    if (rsi < 30) return 'green.500';
    return 'gray.500';
  }, [rsi]);

  return (
    <VStack spacing={6} align="stretch" p={6} bg="gray.900" minH="100vh">
      <Box mb={6}>
        <VStack spacing={3} align="start">
          <HStack spacing={4}>
            <Text
              color="purple.400"
              fontSize="3xl"
              fontWeight="bold"
            >
              XDA Ninja
            </Text>
            <Badge colorScheme="red" fontSize="lg" px={3} py={1}>
              LIVE
            </Badge>
          </HStack>
          <HStack spacing={2}>
            <Text
              bgGradient="linear(to-r, #00C49F, #00A3FF)"
              bgClip="text"
              fontSize="5xl"
              fontWeight="bold"
            >
              LTCUSDT
            </Text>
            <Text color="blue.400" fontSize="5xl">
              Copy Trading
            </Text>
          </HStack>
          <Text color="gray.400" fontSize="lg">
            24/7 Automated LTC/USDT Futures Trading • Real-time Signals • Live Performance
          </Text>
        </VStack>
      </Box>

      {/* Price and Signal Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={6}>
            <VStack align="start" spacing={2}>
              <Text fontSize="md" color={mutedTextColor}>LTC-USDT Price</Text>
              <HStack spacing={3}>
                <Text fontSize="3xl" color={textColor}>
                  ${typeof price === 'number' ? price.toFixed(2) : '-.--'}
                </Text>
                {typeof priceChange === 'number' && (
                  <Badge fontSize="xl" p={2} colorScheme={priceDirection === 'up' ? 'green' : 'red'}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Badge>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={6}>
            <VStack align="start" spacing={2}>
              <Text fontSize="md" color={mutedTextColor}>Trading Signal</Text>
              <Badge 
                colorScheme={signal === 'BUY' ? 'green' : signal === 'SELL' ? 'red' : 'gray'}
                fontSize="2xl"
                px={4}
                py={2}
              >
                {signal || 'NEUTRAL'}
              </Badge>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={6}>
            <VStack align="start" spacing={2}>
              <Text fontSize="md" color={mutedTextColor}>RSI ({indicators?.rsi_period || 14})</Text>
              <HStack spacing={3}>
                <Text fontSize="2xl" color={rsiColor}>
                  {typeof rsi === 'number' ? rsi.toFixed(1) : '-'}
                </Text>
                <Badge 
                  fontSize="xl"
                  p={2}
                  colorScheme={
                    rsiStatus === 'OVERBOUGHT' ? 'red' : 
                    rsiStatus === 'OVERSOLD' ? 'green' : 
                    'gray'
                  }
                >
                  {rsiStatus}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Indicators Section */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={6}>
            <VStack align="start" spacing={3}>
              <Text fontSize="md" color={mutedTextColor}>EMA Indicators ({timeframe})</Text>
              <HStack spacing={6} divider={<Divider orientation="vertical" borderColor={borderColor} />}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>EMA ({indicators?.ema_short_period || 9})</Text>
                  <Text fontSize="2xl" color="blue.400">{emaShort?.toFixed(2) || '-'}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>EMA ({indicators?.ema_long_period || 21})</Text>
                  <Text fontSize="2xl" color="purple.400">{emaLong?.toFixed(2) || '-'}</Text>
                </VStack>
                <Badge fontSize="xl" p={2} colorScheme={emaTrend === 'BULLISH' ? 'green' : 'red'}>
                  {emaTrend}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={6}>
            <VStack align="start" spacing={3}>
              <Text fontSize="md" color={mutedTextColor}>Trend Strength</Text>
              <HStack spacing={4}>
                <Badge 
                  colorScheme={
                    emaTrend === 'BULLISH' 
                      ? (trendStrength === 'STRONG' ? 'green' : 'yellow')
                      : (trendStrength === 'STRONG' ? 'red' : 'yellow')
                  }
                  fontSize="xl"
                  px={4}
                  py={2}
                  variant="solid"
                >
                  {emaTrend === 'BULLISH' 
                    ? (trendStrength === 'STRONG' ? 'STRONG UPTREND' : 'WEAK UPTREND')
                    : (trendStrength === 'STRONG' ? 'STRONG DOWNTREND' : 'WEAK DOWNTREND')}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts Section */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
        <CardBody p={4} pb={2}>
          <Text fontSize="md" color={mutedTextColor} mb={2}>1 Minute Chart</Text>
          <Box bg={cardBg} borderRadius="md" overflow="hidden" height="300px">
            <PriceChart data={chartData1m} interval="1m" />
          </Box>
        </CardBody>
      </Card>

      <SimpleGrid columns={2} spacing={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={4} pb={2}>
            <Text fontSize="md" color={mutedTextColor} mb={2}>15 Minutes Chart</Text>
            <Box bg={cardBg} borderRadius="md" overflow="hidden" height="300px">
              <PriceChart data={chartData15m} interval="15m" />
            </Box>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody p={4} pb={2}>
            <Text fontSize="md" color={mutedTextColor} mb={2}>1 Hour Chart</Text>
            <Box bg={cardBg} borderRadius="md" overflow="hidden" height="300px">
              <PriceChart data={chartData1h} interval="1h" />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
};

export default TradingDashboard; 