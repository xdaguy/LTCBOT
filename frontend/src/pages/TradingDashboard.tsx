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
    <VStack spacing={4} align="stretch" p={4} bg="gray.900" minH="100vh">
      <Box>
        <HStack spacing={2}>
          <Text
            bgGradient="linear(to-r, #00C49F, #00A3FF)"
            bgClip="text"
            fontSize="4xl"
            fontWeight="bold"
          >
            LTCUSDT
          </Text>
          <Text color="blue.400" fontSize="4xl">
            Copy Trading
          </Text>
        </HStack>
      </Box>

      {/* Price and Signal Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={mutedTextColor}>LTC-USDT Price</Text>
              <HStack spacing={2}>
                <Text fontSize="2xl" color={textColor}>
                  ${typeof price === 'number' ? price.toFixed(2) : '-.--'}
                </Text>
                {typeof priceChange === 'number' && (
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
              <Text fontSize="sm" color={mutedTextColor}>RSI ({indicators?.rsi_period || 14})</Text>
              <HStack>
                <Text fontSize="xl" color={rsiColor}>
                  {typeof rsi === 'number' ? rsi.toFixed(1) : '-'}
                </Text>
                <Badge 
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
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={mutedTextColor}>EMA Indicators ({timeframe})</Text>
              <HStack spacing={4} divider={<Divider orientation="vertical" borderColor={borderColor} />}>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color={mutedTextColor}>EMA ({indicators?.ema_short_period || 9})</Text>
                  <Text fontSize="lg" color="blue.400">{emaShort?.toFixed(2) || '-'}</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color={mutedTextColor}>EMA ({indicators?.ema_long_period || 21})</Text>
                  <Text fontSize="lg" color="purple.400">{emaLong?.toFixed(2) || '-'}</Text>
                </VStack>
                <Badge colorScheme={emaTrend === 'BULLISH' ? 'green' : 'red'}>
                  {emaTrend}
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
                    emaTrend === 'BULLISH' 
                      ? (trendStrength === 'STRONG' ? 'green' : 'yellow')
                      : (trendStrength === 'STRONG' ? 'red' : 'yellow')
                  }
                  fontSize="md"
                  px={3}
                  py={1}
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

      {/* Visual separator */}
      <Divider borderColor="gray.600" />

      {/* QR Code Section */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="lg">
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} align="start" justify="space-between" gap={8}>
            {/* Left Section - QR Code and Text */}
            <Flex direction={{ base: 'column', md: 'row' }} align="start" gap={8}>
              {/* QR Code */}
              <Box
                as="img"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://copytrade.securecrypto.cash`}
                alt="Copy Trading QR Code"
                width="160px"
                height="160px"
                borderRadius="lg"
                bg="white"
                p={3}
                boxShadow="lg"
              />
              
              {/* Text Content */}
              <VStack align="start" spacing={3}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                    Start Copy Trading
                  </Text>
                  <Text fontSize="md" color={mutedTextColor}>
                    Scan the QR code to begin your automated trading journey
                  </Text>
                </VStack>
                
                <Divider borderColor="gray.600" />
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="md" color={textColor} fontWeight="medium">
                    Available on Multiple Platforms:
                  </Text>
                  <HStack spacing={3}>
                    <Text color="blue.400">Binance</Text>
                    <Text color="purple.400">KuCoin</Text>
                    <Text color="green.400">MEXC</Text>
                    <Text color="orange.400">More...</Text>
                  </HStack>
                </VStack>
              </VStack>
            </Flex>

            {/* Right Section - Trading Stats */}
            <VStack align="end" spacing={6} minW={{ md: '300px' }}>
              {/* First Line - Copy Traders and ROI */}
              <HStack spacing={12} align="start">
                <VStack align="center" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>Copy Traders</Text>
                  <Text fontSize="2xl" color={textColor} fontWeight="bold">2,547</Text>
                </VStack>

                <VStack align="center" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>ROI (30d)</Text>
                  <Text fontSize="2xl" color="green.400" fontWeight="bold">+187.5%</Text>
                </VStack>
              </HStack>

              {/* Second Line - Strategy, Profit Share, Win Rate */}
              <SimpleGrid columns={3} spacing={8}>
                <VStack align="center" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>Strategy</Text>
                  <Text fontSize="lg" color={textColor}>NASO-CULO</Text>
                </VStack>

                <VStack align="center" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>Profit Share</Text>
                  <Text fontSize="lg" color={textColor}>10%</Text>
                </VStack>

                <VStack align="center" spacing={1}>
                  <Text fontSize="sm" color={mutedTextColor}>Win Rate</Text>
                  <Text fontSize="lg" color="green.400">93%</Text>
                </VStack>
              </SimpleGrid>
            </VStack>
          </Flex>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default TradingDashboard; 