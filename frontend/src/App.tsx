import { Box, Container, Heading, useColorModeValue, Text, HStack, Icon } from '@chakra-ui/react'
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
      py={4}
      backgroundAttachment="fixed"
    >
      <Container maxW="container.xl" px={4}>
        <Box 
          mb={6} 
          p={4}
          borderRadius="xl"
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <HStack spacing={3} justify="center">
            <Heading 
              textAlign="center"
              bgGradient="linear(to-r, cyan.400, blue.500, purple.600)"
              bgClip="text"
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="extrabold"
            >
              LTCUSDT
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="medium"
              color="gray.400"
            >
              Copy Trading
            </Text>
          </HStack>
        </Box>
        <TradingDashboard />
      </Container>
    </Box>
  )
}

export default App
