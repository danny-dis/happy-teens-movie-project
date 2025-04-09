/**
 * Virtualized Grid Component for Movo
 * Provides an efficient grid rendering for large datasets
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';
import loggingService from '../../infrastructure/logging/LoggingService';

// Styled components
const GridContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || '100%'};
  overflow-y: auto;
  overflow-x: hidden;
`;

const GridContent = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height}px;
`;

const RowWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(${props => props.offset}px);
  display: grid;
  grid-template-columns: repeat(${props => props.columnCount}, 1fr);
  grid-gap: ${props => props.gap}px;
  padding: 0 ${props => props.padding}px;
`;

/**
 * Virtualized grid component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Virtualized grid component
 */
const VirtualizedGrid = ({
  items,
  renderItem,
  columnCount,
  rowHeight,
  height = '100%',
  gap = 16,
  padding = 16,
  overscan = 2,
  onEndReached,
  endReachedThreshold = 0.8,
  onScroll,
  className,
  itemKey = (item, index) => index,
  scrollToIndex
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef(null);
  
  // End reached detection
  const { ref: endRef, inView: isEndVisible } = useInView({
    threshold: endReachedThreshold,
    rootMargin: '100px'
  });
  
  // Calculate row count
  const rowCount = Math.ceil(items.length / columnCount);
  
  // Calculate total height
  const totalHeight = rowCount * (rowHeight + gap) - gap + (padding * 2);
  
  // Calculate visible rows
  const getVisibleRange = useCallback(() => {
    if (!containerHeight) {
      return { start: 0, end: 10 };
    }
    
    const rowGap = rowHeight + gap;
    const start = Math.floor(scrollTop / rowGap);
    const end = Math.min(
      rowCount,
      Math.ceil((scrollTop + containerHeight) / rowGap)
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(rowCount, end + overscan)
    };
  }, [scrollTop, containerHeight, rowHeight, gap, rowCount, overscan]);
  
  // Handle scroll
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target;
    
    setScrollTop(scrollTop);
    setIsScrolling(true);
    
    // Clear previous timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }
    
    // Set new timeout
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    // Call onScroll callback
    if (onScroll) {
      onScroll(event);
    }
  }, [onScroll]);
  
  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Handle end reached
  useEffect(() => {
    if (isEndVisible && onEndReached) {
      onEndReached();
    }
  }, [isEndVisible, onEndReached]);
  
  // Handle scroll to index
  useEffect(() => {
    if (scrollToIndex === undefined || !containerRef.current) {
      return;
    }
    
    const rowIndex = Math.floor(scrollToIndex / columnCount);
    const offset = rowIndex * (rowHeight + gap) + padding;
    containerRef.current.scrollTop = offset;
  }, [scrollToIndex, columnCount, rowHeight, gap, padding]);
  
  // Get visible range
  const { start, end } = getVisibleRange();
  
  // Render visible rows
  const visibleRows = [];
  for (let rowIndex = start; rowIndex < end; rowIndex++) {
    const startIndex = rowIndex * columnCount;
    const rowItems = items.slice(startIndex, startIndex + columnCount);
    
    if (rowItems.length === 0) {
      continue;
    }
    
    const offset = rowIndex * (rowHeight + gap) + padding;
    
    visibleRows.push(
      <RowWrapper
        key={`row-${rowIndex}`}
        offset={offset}
        columnCount={columnCount}
        gap={gap}
        padding={padding}
      >
        {rowItems.map((item, colIndex) => {
          const index = startIndex + colIndex;
          const key = itemKey(item, index);
          
          return renderItem({
            item,
            index,
            rowIndex,
            columnIndex: colIndex,
            isScrolling
          });
        })}
      </RowWrapper>
    );
  }
  
  return (
    <GridContainer
      ref={containerRef}
      height={height}
      onScroll={handleScroll}
      className={className}
    >
      <GridContent height={totalHeight}>
        {visibleRows}
      </GridContent>
      <div ref={endRef} style={{ height: 1 }} />
    </GridContainer>
  );
};

VirtualizedGrid.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  columnCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  gap: PropTypes.number,
  padding: PropTypes.number,
  overscan: PropTypes.number,
  onEndReached: PropTypes.func,
  endReachedThreshold: PropTypes.number,
  onScroll: PropTypes.func,
  className: PropTypes.string,
  itemKey: PropTypes.func,
  scrollToIndex: PropTypes.number
};

export default VirtualizedGrid;
