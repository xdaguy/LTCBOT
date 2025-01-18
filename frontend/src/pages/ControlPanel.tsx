import React, { useEffect, useState } from 'react';
import {
  VStack,
  Box,
  Card,
  Text,
  Heading,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  HStack,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';

interface AccountInfo {
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  availableBalance: string;
}

interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
}

interface OrderFormState {
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price: string;
}

export default function ControlPanel() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    side: 'BUY',
    type: 'MARKET',
    quantity: '',
    price: ''
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const toast = useToast();

  // WebSocket connection for real-time price updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.price) {
        setCurrentPrice(data.price);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch account info
      const accountResponse = await fetch('http://localhost:8000/account');
      const accountData = await accountResponse.json();
      setAccountInfo(accountData);

      // Fetch positions
      const positionsResponse = await fetch('http://localhost:8000/positions');
      const positionsData = await positionsResponse.json();
      setPositions(positionsData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update account and positions every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handlePlaceOrder = async () => {
    if (!orderForm.quantity) {
      toast({
        title: 'Invalid Order',
        description: 'Please enter a quantity',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (orderForm.type === 'LIMIT' && !orderForm.price) {
      toast({
        title: 'Invalid Order',
        description: 'Please enter a price for LIMIT order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await fetch('http://localhost:8000/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          side: orderForm.side,
          type: orderForm.type,
          quantity: parseFloat(orderForm.quantity),
          ...(orderForm.type === 'LIMIT' && { price: parseFloat(orderForm.price) })
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to place order');
      }

      toast({
        title: 'Order Placed',
        description: result.message || `Successfully placed ${orderForm.type} ${orderForm.side} order`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setOrderForm(prev => ({
        ...prev,
        quantity: '',
        price: ''
      }));

    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: 'Order Failed',
        description: error instanceof Error ? error.message : 'Failed to place order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch" p={6} minH="100vh" bg="gray.900">
      <Heading color="white" mb={4}>Control Panel</Heading>
      
      {/* Account Overview */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
        <Card p={6} bg="gray.800" color="white" minH="104px">
          <Stat>
            <StatLabel>LTCUSDT Price</StatLabel>
            <StatNumber fontSize="2xl">
              {currentPrice ? currentPrice.toFixed(2) : '---'} USDT
            </StatNumber>
          </Stat>
        </Card>

        <Card p={6} bg="gray.800" color="white" minH="104px">
          <Stat>
            <StatLabel>Total Balance</StatLabel>
            <StatNumber fontSize="2xl">
              {parseFloat(accountInfo?.totalWalletBalance || '0').toFixed(2)} USDT
            </StatNumber>
            <StatHelpText>
              <StatArrow type={parseFloat(accountInfo?.totalUnrealizedProfit || '0') >= 0 ? 'increase' : 'decrease'} />
              {parseFloat(accountInfo?.totalUnrealizedProfit || '0').toFixed(2)} USDT
            </StatHelpText>
          </Stat>
        </Card>

        <Card p={6} bg="gray.800" color="white" minH="104px">
          <Stat>
            <StatLabel>Available Balance</StatLabel>
            <StatNumber fontSize="2xl">
              {parseFloat(accountInfo?.availableBalance || '0').toFixed(2)} USDT
            </StatNumber>
          </Stat>
        </Card>

        <Card p={6} bg="gray.800" color="white" minH="104px">
          <Stat>
            <StatLabel>Last Update</StatLabel>
            <StatNumber fontSize="lg">
              {lastUpdate.toLocaleTimeString()}
            </StatNumber>
          </Stat>
        </Card>
      </SimpleGrid>

      {/* Place Order */}
      <Card p={4} mb={4} bg="gray.800" color="white">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Place Order</Text>
        <VStack spacing={4} align="stretch">
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Order Type</FormLabel>
              <Select
                value={orderForm.type}
                onChange={(e) => setOrderForm(prev => ({ ...prev, type: e.target.value as 'MARKET' | 'LIMIT' }))}
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                _hover={{ bg: 'gray.600' }}
                _focus={{ borderColor: 'blue.300' }}
                sx={{
                  option: {
                    bg: 'gray.700',
                    color: 'white',
                    _hover: { bg: 'gray.600' }
                  }
                }}
              >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Side</FormLabel>
              <Select
                value={orderForm.side}
                onChange={(e) => setOrderForm(prev => ({ ...prev, side: e.target.value as 'BUY' | 'SELL' }))}
                bg={orderForm.side === 'BUY' ? 'green.700' : 'red.700'}
                color="white"
                borderColor={orderForm.side === 'BUY' ? 'green.600' : 'red.600'}
                _hover={{ bg: orderForm.side === 'BUY' ? 'green.600' : 'red.600' }}
                _focus={{ borderColor: 'blue.300' }}
                sx={{
                  option: {
                    bg: 'gray.700',
                    color: 'white',
                    _hover: { bg: 'gray.600' }
                  }
                }}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </Select>
            </FormControl>
          </HStack>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Quantity</FormLabel>
              <NumberInput
                value={orderForm.quantity}
                onChange={(value) => setOrderForm(prev => ({ ...prev, quantity: value }))}
                min={0}
                precision={3}
                step={0.001}
              >
                <NumberInputField
                  bg="gray.700"
                  _hover={{ bg: 'gray.600' }}
                  _focus={{ borderColor: 'blue.300' }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {orderForm.type === 'LIMIT' && (
              <FormControl>
                <FormLabel>Price (USDT)</FormLabel>
                <NumberInput
                  value={orderForm.price}
                  onChange={(value) => setOrderForm(prev => ({ ...prev, price: value }))}
                  min={0}
                  precision={2}
                  step={0.01}
                >
                  <NumberInputField
                    bg="gray.700"
                    _hover={{ bg: 'gray.600' }}
                    _focus={{ borderColor: 'blue.300' }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}
          </HStack>
          <Button
            colorScheme={orderForm.side === 'BUY' ? 'green' : 'red'}
            onClick={handlePlaceOrder}
            isLoading={isPlacingOrder}
            loadingText="Placing Order..."
            width="full"
            mt={2}
          >
            Place {orderForm.type} {orderForm.side} Order
          </Button>
        </VStack>
      </Card>

      {/* Active Positions */}
      <Card p={6} bg="gray.800" color="white">
        <Heading size="md" mb={4}>Active Positions</Heading>
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="gray.400">Symbol</Th>
                <Th color="gray.400">Position</Th>
                <Th color="gray.400">Entry Price</Th>
                <Th color="gray.400">Mark Price</Th>
                <Th color="gray.400">PnL</Th>
                <Th color="gray.400">Liquidation</Th>
              </Tr>
            </Thead>
            <Tbody>
              {positions.map((position, index) => (
                <Tr key={index}>
                  <Td>{position.symbol}</Td>
                  <Td>
                    <Badge colorScheme={parseFloat(position.positionAmt) > 0 ? 'green' : 'red'}>
                      {position.positionAmt}
                    </Badge>
                  </Td>
                  <Td>{parseFloat(position.entryPrice).toFixed(2)}</Td>
                  <Td>{parseFloat(position.markPrice).toFixed(2)}</Td>
                  <Td color={parseFloat(position.unRealizedProfit) >= 0 ? 'green.300' : 'red.300'}>
                    {parseFloat(position.unRealizedProfit).toFixed(2)}
                  </Td>
                  <Td>{parseFloat(position.liquidationPrice).toFixed(2)}</Td>
                </Tr>
              ))}
              {positions.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center">No active positions</Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>
    </VStack>
  );
} 