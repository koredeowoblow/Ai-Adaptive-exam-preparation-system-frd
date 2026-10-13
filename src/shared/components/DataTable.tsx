import * as React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortKey?: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  wrap?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  emptyState?: React.ReactNode;
  bulkActions?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  keyExtractor,
  selectable = false,
  selectedIds,
  onSelectRow,
  onSelectAll,
  sortField,
  sortOrder = 'asc',
  onSort,
  currentPage,
  pageSize = 10,
  totalCount,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  emptyState,
  bulkActions,
}: DataTableProps<T>): React.ReactElement {
  const isAllSelected = selectable && data.length > 0 && selectedIds && data.every((item) => selectedIds.has(keyExtractor(item)));
  const isPartiallySelected =
    selectable &&
    selectedIds &&
    data.some((item) => selectedIds.has(keyExtractor(item))) &&
    !isAllSelected;

  const totalPages = totalCount !== undefined ? Math.ceil(totalCount / pageSize) : 1;
  const startItem = totalCount !== undefined && totalCount > 0 && currentPage ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalCount !== undefined && currentPage ? Math.min(currentPage * pageSize, totalCount) : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Optional Bulk Selection Action Bar */}
      {selectable && selectedIds && selectedIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--color-surface-raised)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            color: 'var(--color-text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>{selectedIds.size}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>item(s) selected</span>
          </div>
          {bulkActions && <div style={{ display: 'flex', gap: '8px' }}>{bulkActions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            textAlign: 'left',
          }}
        >
          {/* Header */}
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-0)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {selectable && (
                <th style={{ width: '40px', padding: '10px 12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(isPartiallySelected);
                    }}
                    onChange={onSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}

              {columns.map((col, index) => {
                const sortKey = col.sortKey || (col.accessorKey as string);
                const isSorted = sortField && sortField === sortKey;
                const isSortable = Boolean(col.sortable && sortKey && onSort);

                return (
                  <th
                    key={index}
                    style={{
                      padding: '10px 16px',
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      if (isSortable && sortKey && onSort) {
                        onSort(sortKey);
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ display: 'inline-flex', opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: pageSize || 5 }).map((_, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {selectable && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ width: '14px', height: '14px', backgroundColor: 'var(--color-border)', borderRadius: '2px', margin: 'auto' }} />
                    </td>
                  )}
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          height: '14px',
                          backgroundColor: 'var(--color-surface-raised)',
                          borderRadius: '4px',
                          width: `${60 + ((rIdx + cIdx) % 4) * 10}%`,
                          animation: 'pulse 1.5s infinite ease-in-out',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state row
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  {emptyState || <span style={{ color: 'var(--color-text-muted)' }}>No data available</span>}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectable && selectedIds ? selectedIds.has(id) : false;

                return (
                  <tr
                    key={id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-0)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectable && (
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${id}`}
                          checked={isSelected}
                          onChange={() => onSelectRow && onSelectRow(id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}

                    {columns.map((col, cIdx) => {
                      let content: React.ReactNode;
                      if (col.cell) {
                        content = col.cell(item);
                      } else if (col.accessorKey) {
                        content = item[col.accessorKey] as unknown as React.ReactNode;
                      } else {
                        content = null;
                      }

                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: '12px 16px',
                            color: 'var(--color-text)',
                            textAlign: col.align || 'left',
                            whiteSpace: col.wrap ? 'normal' : 'nowrap',
                            wordBreak: col.wrap ? 'break-word' : undefined,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {currentPage !== undefined && totalCount !== undefined && onPageChange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: 'var(--color-surface-0)',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Row count info */}
          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
            {totalCount > 0 ? (
              <span>
                Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalCount}</strong> items
              </span>
            ) : (
              <span>0 items</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page size selector */}
            {onPageSizeChange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem' }}>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Prev / Next buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', marginRight: '4px' }}>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: currentPage <= 1 || isLoading ? 'not-allowed' : 'pointer',
                  opacity: currentPage <= 1 || isLoading ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => onPageChange(currentPage + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: currentPage >= totalPages || isLoading ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= totalPages || isLoading ? 0.4 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
