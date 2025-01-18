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
  VStack
} from '@chakra-ui/react'
import axios from 'axios'
import PriceChart from '../components/PriceChart'

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
}

function TradingDashboard() {
  const cardBg = useColorModeValue('gray.800', 'gray.800')
  const borderColor = useColorModeValue('blue.400', 'blue.400')

  const { data, isLoading, error } = useQuery<PriceData>(
    'price',
    async () => {
      try {
        const response = await axios.get('http://localhost:8000/price')
        console.log('15m Chart Data:', response.data.chart_data_15m)
        console.log('1h Chart Data:', response.data.chart_data_1h)
        return response.data
      } catch (err) {
        console.error('API Error:', err)
        throw err
      }
    },
    {
      refetchInterval: 1000,
      staleTime: 500,
    }
  )

  if (isLoading) return (
    <Box textAlign="center" py={10}>
      <Text fontSize="xl">Loading market data...</Text>
    </Box>
  )
  
  if (error) return (
    <Box textAlign="center" py={10} color="red.400">
      <Text fontSize="xl">Error fetching market data</Text>
    </Box>
  )

  return (
    <VStack spacing={8}>
      <Grid 
        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
        gap={6}
        w="full"
      >
        <GridItem>
          <Card 
            bg={cardBg} 
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="xl"
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="lg" color="gray.400">Current LTC Price</StatLabel>
                <StatNumber 
                  fontSize="3xl" 
                  bgGradient="linear(to-r, cyan.400, blue.500)"
                  bgClip="text"
                >
                  ${data?.price.toFixed(2)}
                </StatNumber>
                <StatHelpText color="gray.500">Live updates</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card 
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="xl"
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="lg" color="gray.400">Trading Signal</StatLabel>
                <StatNumber 
                  fontSize="3xl"
                  color={
                    data?.signal === 'buy' 
                      ? 'green.400' 
                      : data?.signal === 'sell' 
                      ? 'red.400' 
                      : 'gray.400'
                  }
                >
                  {data?.signal?.toUpperCase() || 'HOLD'}
                </StatNumber>
                <StatHelpText color="gray.500">Based on EMA crossover</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card 
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="xl"
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="lg" color="gray.400">EMA Indicators</StatLabel>
                <StatNumber fontSize="2xl">
                  <Text as="span" color="blue.400">{data?.ema_short?.toFixed(2)}</Text>
                  <Text as="span" color="gray.500"> / </Text>
                  <Text as="span" color="purple.400">{data?.ema_long?.toFixed(2)}</Text>
                </StatNumber>
                <StatHelpText color="gray.500">Short/Long EMA</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Grid 
        templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} 
        gap={6}
        w="full"
      >
        <GridItem>
          <Card 
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="xl"
            p={4}
          >
            {data?.chart_data_15m && (
              <PriceChart 
                data={data.chart_data_15m} 
                interval="15 Minutes"
              />
            )}
          </Card>
        </GridItem>

        <GridItem>
          <Card 
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="xl"
            p={4}
          >
            {data?.chart_data_1h && (
              <PriceChart 
                data={data.chart_data_1h} 
                interval="1 Hour"
              />
            )}
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}

export default TradingDashboard 