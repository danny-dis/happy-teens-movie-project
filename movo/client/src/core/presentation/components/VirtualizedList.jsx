/**
 * Virtualized List Component for Movo
 * Provides an efficient list rendering for large datasets
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';
import loggingService from '../../infrastructure/logging/LoggingService';

// Styled components
const ListContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || '100%'};
  overflow-y: auto;
  overflow-x: hidden;
`;

const ListContent = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height}px;
`;

const ItemWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(${props => props.offset}px);
`;

/**
 * Virtualized list component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Virtualized list component
 */
const VirtualizedList = ({
  items,
  renderItem,
  itemHeight,
  height = '100%',
  overscan = 5,
  onEndReached,
  endReachedThreshold = 0.8,
  onScroll,
  className,
  itemKey = (item, index) => index,
  estimatedItemHeight,
  variableHeights = false,
  scrollToIndex,
  onItemsRendered
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [itemHeights, setItemHeights] = useState({});
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef(null);
  
  // End reached detection
  const { ref: endRef, inView: isEndVisible } = useInView({
    threshold: endReachedThreshold,
    rootMargin: '100px'
  });
  
  // Calculate item heights for variable height mode
  const getItemHeight = useCallback((index) => {
    if (!variableHeights) {
      return itemHeight;
    }
    
    return itemHeights[index] || estimatedItemHeight || itemHeight;
  }, [variableHeights, itemHeight, itemHeights, estimatedItemHeight]);
  
  // Calculate total height
  const totalHeight = useCallback(() => {
    if (!variableHeights) {
      return items.length * itemHeight;
    }
    
    return items.reduce((height, _, index) => {
      return height + getItemHeight(index);
    }, 0);
  }, [items, itemHeight, variableHeights, getItemHeight]);
  
  // Calculate visible items
  const getVisibleRange = useCallback(() => {
    if (!containerHeight) {
      return { start: 0, end: 10 };
    }
    
    if (!variableHeights) {
      // Fixed height calculation
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight)
      );
      
      return {
        start: Math.max(0, start - overscan),
        end: Math.min(items.length, end + overscan)
      };
    } else {
      // Variable height calculation
      let currentOffset = 0;
      let startIndex = 0;
      let endIndex = 0;
      
      // Find start index
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        
        if (currentOffset + height > scrollTop) {
          startIndex = i;
          break;
        }
        
        currentOffset += height;
      }
      
      // Find end index
      currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        currentOffset += height;
        
        if (currentOffset > scrollTop + containerHeight) {
          endIndex = i;
          break;
        }
      }
      
      return {
        start: Math.max(0, startIndex - overscan),
        end: Math.min(items.length, endIndex + overscan)
      };
    }
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan, variableHeights, getItemHeight]);
  
  // Calculate item offset
  const getItemOffset = useCallback((index) => {
    if (!variableHeights) {
      return index * itemHeight;
    }
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    
    return offset;
  }, [itemHeight, variableHeights, getItemHeight]);
  
  // Update item height
  const updateItemHeight = useCallback((index, height) => {
    if (!variableHeights) {
      return;
    }
    
    setItemHeights(prev => {
      if (prev[index] === height) {
        return prev;
      }
      
      return {
        ...prev,
        [index]: height
      };
    });
  }, [variableHeights]);
  
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
    
    const offset = getItemOffset(scrollToIndex);
    containerRef.current.scrollTop = offset;
  }, [scrollToIndex, getItemOffset]);
  
  // Get visible range
  const { start, end } = getVisibleRange();
  
  // Render visible items
  const visibleItems = items.slice(start, end).map((item, index) => {
    const actualIndex = start + index;
    const key = itemKey(item, actualIndex);
    const offset = getItemOffset(actualIndex);
    
    return (
      <ItemWrapper key={key} offset={offset}>
        {renderItem({
          item,
          index: actualIndex,
          isScrolling,
          updateHeight: (height) => updateItemHeight(actualIndex, height)
        })}
      </ItemWrapper>
    );
  });
  
  // Call onItemsRendered callback
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered({
        startIndex: start,
        endIndex: end - 1,
        visibleStartIndex: start,
        visibleEndIndex: end - 1
      });
    }
  }, [start, end, onItemsRendered]);
  
  return (
    <ListContainer
      ref={containerRef}
      height={height}
      onScroll={handleScroll}
      className={className}
    >
      <ListContent height={totalHeight()}>
        {visibleItems}
      </ListContent>
      <div ref={endRef} style={{ height: 1 }} />
    </ListContainer>
  );
};

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  overscan: PropTypes.number,
  onEndReached: PropTypes.func,
  endReachedThreshold: PropTypes.number,
  onScroll: PropTypes.func,
  className: PropTypes.string,
  itemKey: PropTypes.func,
  estimatedItemHeight: PropTypes.number,
  variableHeights: PropTypes.bool,
  scrollToIndex: PropTypes.number,
  onItemsRendered: PropTypes.func
};

export default VirtualizedList;
