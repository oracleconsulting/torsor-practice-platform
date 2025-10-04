
import React from 'react';

interface ScrollingFeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function ScrollingFeed<T>({ items, renderItem }: ScrollingFeedProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
