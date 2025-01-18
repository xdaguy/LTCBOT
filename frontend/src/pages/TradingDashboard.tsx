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
  useColorModeValue
} from '@chakra-ui/react'
import axios from 'axios'

interface PriceData {
  price: number
  signal?: 'buy' | 'sell' | 'hold'
  ema_short?: number
  ema_long?: number
}

function TradingDashboard() {
  const cardBg = useColorModeValue('gray.800', 'gray.800')
  const borderColor = useColorModeValue('blue.400', 'blue.400')

  const { data, isLoading, error } = useQuery<PriceData>(
    'price',
    async () => {
      const response = await axios.get('/api/price')
      return response.data
    },
    {
      refetchInterval: 1000, // Update every second
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
    <Grid 
      templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
      gap={6}
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
  )
}

export default TradingDashboard 