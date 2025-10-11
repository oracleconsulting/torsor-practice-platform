import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  rowHeight: number;
  containerHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtual scrolling table for efficient rendering of large datasets
 * Only renders visible rows + overscan buffer
 */
export function VirtualTable<T>({
  data,
  rowHeight,
  containerHeight,
  renderRow,
  renderHeader,
  overscan = 5,
  className = '',
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = data.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(data.length, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;

  const visibleData = data.slice(startIndex, endIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      {renderHeader && (
        <div className="sticky top-0 z-10 bg-white">
          {renderHeader()}
        </div>
      )}
      
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleData.map((item, index) => (
            <div key={startIndex + index} style={{ height: rowHeight }}>
              {renderRow(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual scrolling grid for card-based layouts
 */
interface VirtualGridProps<T> {
  data: T[];
  itemHeight: number;
  itemWidth: number;
  gap: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  data,
  itemHeight,
  itemWidth,
  gap,
  containerHeight,
  containerWidth,
  renderItem,
  overscan = 2,
  className = '',
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rows = Math.ceil(data.length / columns);
  const totalHeight = rows * (itemHeight + gap);
  
  const visibleRows = Math.ceil(containerHeight / (itemHeight + gap));
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endRow = Math.min(rows, startRow + visibleRows + overscan * 2);
  
  const startIndex = startRow * columns;
  const endIndex = Math.min(data.length, endRow * columns);
  const offsetY = startRow * (itemHeight + gap);
  
  const visibleData = data.slice(startIndex, endIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`,
            willChange: 'transform',
          }}
        >
          {visibleData.map((item, index) => (
            <div key={startIndex + index}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

