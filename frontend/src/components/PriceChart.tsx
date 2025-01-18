import { Box, useColorModeValue, Text } from '@chakra-ui/react';

interface PriceChartProps {
  data: Array<{
    time: string;
    value: number;
  }>;
  interval: string;
}

const PriceChart = ({ data, interval }: PriceChartProps) => {
  const chartBg = '#1A202C';  // Dark background
  const textColor = '#A0AEC0'; // Gray text
  const lineColor = '#2962FF'; // Blue line
  const areaColor = 'rgba(41, 98, 255, 0.1)'; // Transparent blue

  console.log(`${interval} Chart Data:`, data);

  if (!data || data.length === 0) {
    return (
      <Box
        w="100%"
        h="300px"
        bg={chartBg}
        borderRadius="lg"
        p={4}
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={textColor}>No data available</Text>
      </Box>
    );
  }

  // Calculate min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate points for the line
  const width = 800;
  const height = 250;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = height - (padding + ((d.value - minValue) / range) * chartHeight);
    return `${x},${y}`;
  }).join(' ');

  // Add time labels
  const timeLabels = data.filter((_, i) => i % Math.floor(data.length / 5) === 0).map(d => {
    const time = new Date(d.time).toLocaleTimeString();
    return time;
  });

  return (
    <Box
      w="100%"
      h="300px"
      bg={chartBg}
      borderRadius="lg"
      p={4}
      position="relative"
      overflow="hidden"
    >
      <Text
        position="absolute"
        top={2}
        left={4}
        color={textColor}
        fontSize="sm"
        fontWeight="medium"
        zIndex={2}
      >
        {interval} Chart - ${data[data.length - 1]?.value.toFixed(2)}
      </Text>
      
      <Box position="relative" width="100%" height="100%">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Grid lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * chartHeight) / 4}
              x2={width - padding}
              y2={padding + (i * chartHeight) / 4}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Price line */}
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
          />

          {/* Area under the line */}
          <path
            d={`M ${padding},${height - padding} ${points} ${width - padding},${height - padding} Z`}
            fill={areaColor}
          />

          {/* Time labels */}
          {timeLabels.map((label, i) => (
            <text
              key={`label-${i}`}
              x={padding + (i * chartWidth) / (timeLabels.length - 1)}
              y={height - 10}
              fill={textColor}
              fontSize="10"
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {/* Price labels */}
          {[...Array(5)].map((_, i) => (
            <text
              key={`price-${i}`}
              x={padding - 5}
              y={padding + (i * chartHeight) / 4}
              fill={textColor}
              fontSize="10"
              textAnchor="end"
            >
              ${(maxValue - (i * range) / 4).toFixed(2)}
            </text>
          ))}
        </svg>
      </Box>
    </Box>
  );
};

export default PriceChart; 