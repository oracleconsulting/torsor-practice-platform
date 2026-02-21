import type { ReactNode } from 'react';

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

/** Styled data table wrapper — applies .data-table utility class */
export function DataTable({ children, className = '' }: DataTableProps) {
  return <table className={`data-table ${className}`.trim()}>{children}</table>;
}
