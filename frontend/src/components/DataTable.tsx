import React from 'react'
import './DataTable.css'

interface TableColumn<T> {
  key: keyof T | 'actions'
  label: string
  width?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T extends { id: string | number }> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (id: string | number) => void
  pagination?: { page: number; pageSize: number; total: number }
  onPageChange?: (page: number) => void
  searchValue?: string
  onSearch?: (value: string) => void
}

const DataTable = <T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  searchValue = '',
  onSearch
}: DataTableProps<T>) => {
  return (
    <div className="data-table-container">
      {onSearch && (
        <div className="table-search">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={col.sortable ? 'sortable' : ''}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="table-loading">
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.key === 'actions' ? (
                        <div className="table-actions">
                          {onEdit && (
                            <button
                              className="action-btn edit-btn"
                              onClick={e => {
                                e.stopPropagation()
                                onEdit(row)
                              }}
                            >
                              ✎
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="action-btn delete-btn"
                              onClick={e => {
                                e.stopPropagation()
                                if (confirm('Tem certeza?')) onDelete(row.id)
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ) : col.render ? (
                        col.render(row[col.key], row)
                      ) : (
                        String(row[col.key] ?? '')
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            ← Anterior
          </button>
          <span>
            Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
          </span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}

export default DataTable
