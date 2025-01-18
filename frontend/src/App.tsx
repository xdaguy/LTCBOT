import { Box, Container, Heading, useColorModeValue } from '@chakra-ui/react'
import TradingDashboard from './pages/TradingDashboard'

function App() {
  const bgGradient = useColorModeValue(
    'linear(to-br, gray.900, blue.900)',
    'linear(to-br, gray.900, blue.900)'
  )

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      py={8}
      backgroundAttachment="fixed"
    >
      <Container maxW="container.xl">
        <Heading 
          mb={8} 
          textAlign="center"
          bgGradient="linear(to-r, cyan.400, blue.500, purple.600)"
          bgClip="text"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="extrabold"
        >
          LTC-USDT Trading Bot
        </Heading>
        <TradingDashboard />
      </Container>
    </Box>
  )
}

export default App
