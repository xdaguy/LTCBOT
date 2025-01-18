import { Box, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState, useMemo } from 'react';

interface PriceChartProps {
  data: Array<{
    time: string;
    value: number;
  }>;
  interval: string;
  compact?: boolean;
}

const PriceChart = ({ data, interval, compact = false }: PriceChartProps) => {
  const [interpolatedData, setInterpolatedData] = useState(data);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const previousData = useRef(data);
  const animationFrame = useRef<number>();
  const microMovementRef = useRef<number>();
  const lastMicroUpdate = useRef<number>(0);

  // Colors
  const chartBg = '#1a202c';
  const gridColor = '#2d3748';
  const lineColor = '#3182ce';
  const areaColor = 'rgba(49, 130, 206, 0.1)';
  const textColor = '#a0aec0';

  // Chart dimensions
  const dimensions = useMemo(() => {
    const width = 800;
    const height = compact ? 120 : 250;
    const margin = compact 
      ? { top: 25, right: 30, bottom: 20, left: 50 }
      : { top: 25, right: 30, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    return { width, height, margin, chartWidth, chartHeight };
  }, [compact]);

  // Calculate scales and points
  const chartData = useMemo(() => {
    if (!interpolatedData?.length) return null;

    const values = interpolatedData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const padding = 0.1;

    const yMin = minValue - range * padding;
    const yMax = maxValue + range * padding;
    const yRange = yMax - yMin;

    const points = interpolatedData.map((d, i) => {
      const x = dimensions.margin.left + (i / (interpolatedData.length - 1)) * dimensions.chartWidth;
      const y = dimensions.margin.top + dimensions.chartHeight - ((d.value - yMin) / yRange) * dimensions.chartHeight;
      return { x, y, ...d };
    });

    return { points, yMin, yMax, yRange };
  }, [interpolatedData, dimensions]);

  // Function to generate realistic micro-movements
  const generateMicroMovement = (currentValue: number, volatility: number = 0.0002) => {
    const randomFactor = Math.random() * 2 - 1;
    const movement = currentValue * volatility * randomFactor;
    return movement;
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    const startTime = performance.now();
    const duration = 1000; // Animation duration in ms
    
    // Store the previous state for interpolation
    const prevData = previousData.current;
    previousData.current = data;

    // If it's the first render or no previous data, just set the data
    if (!prevData || prevData.length === 0) {
      setInterpolatedData(data);
      return;
    }

    // Animation function for main data updates
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease function (cubic)
      const ease = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = ease(progress);

      // Interpolate between previous and current values
      const newData = data.map((point, i) => {
        const prevPoint = prevData[i] || point;
        const value = prevPoint.value + (point.value - prevPoint.value) * easedProgress;
        return {
          ...point,
          value
        };
      });

      setInterpolatedData(newData);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    // Start main animation
    animationFrame.current = requestAnimationFrame(animate);

    // Micro-movement animation for last point only
    const animateMicroMovements = (timestamp: number) => {
      if (timestamp - lastMicroUpdate.current > 16) { // ~60fps
        lastMicroUpdate.current = timestamp;
        
        setInterpolatedData(currentData => {
          if (!currentData || currentData.length === 0) return currentData;

          // Only modify the last point
          const lastPoint = currentData[currentData.length - 1];
          const microMovement = generateMicroMovement(lastPoint.value);
          
          return [
            ...currentData.slice(0, -1),
            {
              ...lastPoint,
              value: lastPoint.value + microMovement
            }
          ];
        });
      }
      microMovementRef.current = requestAnimationFrame(animateMicroMovements);
    };

    // Start micro-movement animation
    microMovementRef.current = requestAnimationFrame(animateMicroMovements);

    // Cleanup
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (microMovementRef.current) {
        cancelAnimationFrame(microMovementRef.current);
      }
    };
  }, [data]);

  if (!chartData) return <Box>No data available</Box>;

  const { points, yMax, yRange } = chartData;

  // Create smooth path using cubic bezier curves
  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    
    const prev = points[i - 1];
    const curr = point;
    const next = points[i + 1];
    
    if (i === 1) {
      return `${path} C ${prev.x + (curr.x - prev.x) * 0.5},${prev.y} ${prev.x + (curr.x - prev.x) * 0.5},${curr.y} ${curr.x},${curr.y}`;
    }
    
    if (i === points.length - 1) {
      return `${path} S ${curr.x},${curr.y} ${curr.x},${curr.y}`;
    }
    
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = curr.x - (next.x - curr.x) * 0.5;
    const cp2y = curr.y;
    
    return `${path} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x},${dimensions.height - dimensions.margin.bottom} L ${dimensions.margin.left},${dimensions.height - dimensions.margin.bottom} Z`;

  return (
    <Box
      w="100%"
      h={compact ? "120px" : "250px"}
      bg={chartBg}
      borderRadius="xl"
      p={2}
      position="relative"
      overflow="hidden"
    >
      <Box position="relative" width="100%" height="100%">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(49, 130, 206, 0.2)" />
              <stop offset="100%" stopColor="rgba(49, 130, 206, 0)" />
            </linearGradient>
            <clipPath id="chartClip">
              <rect
                x={dimensions.margin.left}
                y={dimensions.margin.top}
                width={dimensions.chartWidth}
                height={dimensions.chartHeight}
                fill="none"
              />
            </clipPath>
          </defs>

          {/* Grid with animation */}
          <g className="grid-lines">
            {[...(compact ? Array(3) : Array(5))].map((_, i) => {
              const y = dimensions.margin.top + (i * dimensions.chartHeight) / (compact ? 2 : 4);
              return (
                <g key={`grid-${i}`} className="grid-line">
                  <line
                    x1={dimensions.margin.left}
                    y1={y}
                    x2={dimensions.width - dimensions.margin.right}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={dimensions.margin.left - 10}
                    y={y}
                    fill={textColor}
                    fontSize="10"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    ${(yMax - (i * yRange) / (compact ? 2 : 4)).toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Chart area with clipping */}
          <g clipPath="url(#chartClip)">
            {/* Area under the line */}
            <path
              d={areaPath}
              fill={areaColor}
              className="area"
            />

            {/* Price line */}
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="line"
            />

            {/* Data points */}
            {points.map((point, i) => (
              <circle
                key={`point-${i}`}
                cx={point.x}
                cy={point.y}
                r={i === points.length - 1 ? 3 : hoveredPoint === i ? 4 : compact ? 1.5 : 2}
                fill={i === points.length - 1 ? lineColor : chartBg}
                stroke={lineColor}
                strokeWidth={i === points.length - 1 ? 2 : 1}
              />
            ))}
          </g>
        </svg>
      </Box>
    </Box>
  );
};

export default PriceChart; 