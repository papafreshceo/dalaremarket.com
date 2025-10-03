// src/components/ExcelTable.tsx
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Column {
  key: string
  label: string
  width: number
  editable?: boolean
  type?: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  align?: 'left' | 'center' | 'right'
}

interface ExcelTableProps {
  data: any[]
  columns: Column[]
  onDataChange?: (data: any[]) => void
  onSave?: (modifiedRows: any[]) => void
  rowHeight?: number
  fontSize?: number
}

export default function ExcelTable({ 
  data, 
  columns, 
  onDataChange,
  onSave,
  rowHeight = 28,
  fontSize = 13
}: ExcelTableProps) {
  const [tableData, setTableData] = useState(data)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null)
  const [modifiedRows, setModifiedRows] = useState<Set<number>>(new Set())
  const [copiedData, setCopiedData] = useState<any[][]>([])
  const [history, setHistory] = useState<any[][]>([data])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  const tableRef = useRef<HTMLTableElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 데이터 변경 시 업데이트
  useEffect(() => {
    setTableData(data)
    setHistory([data])
    setHistoryIndex(0)
  }, [data])

  // 셀 키 생성
  const getCellKey = (row: number, col: number) => `${row}-${col}`

  // 셀 선택 범위 계산
  const getSelectedRange = useCallback(() => {
    if (!dragStart || !dragEnd) return new Set<string>()
    
    const minRow = Math.min(dragStart.row, dragEnd.row)
    const maxRow = Math.max(dragStart.row, dragEnd.row)
    const minCol = Math.min(dragStart.col, dragEnd.col)
    const maxCol = Math.max(dragStart.col, dragEnd.col)
    
    const cells = new Set<string>()
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.add(getCellKey(r, c))
      }
    }
    return cells
  }, [dragStart, dragEnd])

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    
    // Shift 키를 누르고 있으면 범위 선택
    if (e.shiftKey && currentCell) {
      setDragStart(currentCell)
      setDragEnd({ row, col })
      setSelectedCells(getSelectedRange())
    } else {
      setDragStart({ row, col })
      setDragEnd({ row, col })
      setCurrentCell({ row, col })
      setSelectedCells(new Set([getCellKey(row, col)]))
      setIsDragging(true)
    }
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ row, col })
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setSelectedCells(getSelectedRange())
      setIsDragging(false)
    }
  }

  // 더블클릭으로 편집 모드
  const handleDoubleClick = (row: number, col: number) => {
    const column = columns[col]
    if (!column.editable) return
    
    setEditingCell(getCellKey(row, col))
    setEditValue(tableData[row][column.key] || '')
  }

  // 값 변경 처리
  const handleValueChange = (row: number, col: number, value: any) => {
    const column = columns[col]
    const newData = [...tableData]
    newData[row] = { ...newData[row], [column.key]: value }
    
    setTableData(newData)
    setModifiedRows(prev => new Set(prev).add(row))
    setEditingCell(null)
    
    // 히스토리 업데이트
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    if (onDataChange) {
      onDataChange(newData)
    }
  }

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentCell) return
    
    const { row, col } = currentCell
    const isEditing = editingCell !== null
    
    // 편집 중이 아닐 때만 네비게이션
    if (!isEditing) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (row > 0) {
            setCurrentCell({ row: row - 1, col })
            setSelectedCells(new Set([getCellKey(row - 1, col)]))
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (row < tableData.length - 1) {
            setCurrentCell({ row: row + 1, col })
            setSelectedCells(new Set([getCellKey(row + 1, col)]))
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (col > 0) {
            setCurrentCell({ row, col: col - 1 })
            setSelectedCells(new Set([getCellKey(row, col - 1)]))
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (col < columns.length - 1) {
            setCurrentCell({ row, col: col + 1 })
            setSelectedCells(new Set([getCellKey(row, col + 1)]))
          }
          break
        case 'Enter':
          e.preventDefault()
          if (columns[col].editable) {
            setEditingCell(getCellKey(row, col))
            setEditValue(tableData[row][columns[col].key] || '')
          }
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          if (columns[col].editable) {
            handleValueChange(row, col, '')
          }
          break
        case 'F2':
          e.preventDefault()
          if (columns[col].editable) {
            setEditingCell(getCellKey(row, col))
            setEditValue(tableData[row][columns[col].key] || '')
          }
          break
      }
      
      // 복사
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        handleCopy()
      }
      
      // 붙여넣기
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        handlePaste()
      }
      
      // 실행 취소
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      
      // 다시 실행
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
      
      // 전체 선택
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        selectAll()
      }
    } else {
      // 편집 중일 때
      if (e.key === 'Enter') {
        e.preventDefault()
        const input = document.activeElement as HTMLInputElement
        if (input && input.value !== undefined) {
          handleValueChange(row, col, input.value)
        }
        // 다음 행으로 이동
        if (row < tableData.length - 1) {
          setCurrentCell({ row: row + 1, col })
          setSelectedCells(new Set([getCellKey(row + 1, col)]))
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEditingCell(null)
        setEditValue('')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const input = document.activeElement as HTMLInputElement
        if (input && input.value !== undefined) {
          handleValueChange(row, col, input.value)
        }
        // 다음 열로 이동
        if (col < columns.length - 1) {
          setCurrentCell({ row, col: col + 1 })
          setSelectedCells(new Set([getCellKey(row, col + 1)]))
        }
      }
    }
  }, [currentCell, editingCell, tableData, columns])

  // 복사
  const handleCopy = () => {
    const cells = Array.from(selectedCells)
    if (cells.length === 0) return
    
    const rows = new Map<number, Map<number, any>>()
    
    cells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number)
      if (!rows.has(row)) {
        rows.set(row, new Map())
      }
      rows.get(row)!.set(col, tableData[row][columns[col].key])
    })
    
    const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b)
    const copiedArray = sortedRows.map(row => {
      const cols = rows.get(row)!
      const sortedCols = Array.from(cols.keys()).sort((a, b) => a - b)
      return sortedCols.map(col => cols.get(col))
    })
    
    setCopiedData(copiedArray)
    
    // 클립보드에도 복사
    const text = copiedArray.map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(text)
  }

  // 붙여넣기
  const handlePaste = async () => {
    if (!currentCell) return
    
    try {
      const text = await navigator.clipboard.readText()
      const rows = text.split('\n').map(row => row.split('\t'))
      
      const newData = [...tableData]
      const { row: startRow, col: startCol } = currentCell
      
      rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const targetRow = startRow + rowIndex
          const targetCol = startCol + colIndex
          
          if (targetRow < newData.length && targetCol < columns.length) {
            const column = columns[targetCol]
            if (column.editable) {
              newData[targetRow] = {
                ...newData[targetRow],
                [column.key]: value
              }
              setModifiedRows(prev => new Set(prev).add(targetRow))
            }
          }
        })
      })
      
      setTableData(newData)
      if (onDataChange) {
        onDataChange(newData)
      }
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  // 실행 취소
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setTableData(history[newIndex])
      if (onDataChange) {
        onDataChange(history[newIndex])
      }
    }
  }

  // 다시 실행
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setTableData(history[newIndex])
      if (onDataChange) {
        onDataChange(history[newIndex])
      }
    }
  }

  // 전체 선택
  const selectAll = () => {
    const cells = new Set<string>()
    for (let r = 0; r < tableData.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        cells.add(getCellKey(r, c))
      }
    }
    setSelectedCells(cells)
    setDragStart({ row: 0, col: 0 })
    setDragEnd({ row: tableData.length - 1, col: columns.length - 1 })
  }

  // 키보드 이벤트 리스너
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 마우스 업 이벤트 리스너
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }
    
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  // 선택된 범위 업데이트
  useEffect(() => {
    if (isDragging) {
      setSelectedCells(getSelectedRange())
    }
  }, [isDragging, dragStart, dragEnd, getSelectedRange])

  // 저장 버튼 핸들러
  const handleSaveClick = () => {
    if (onSave && modifiedRows.size > 0) {
      const modifiedData = Array.from(modifiedRows).map(index => tableData[index])
      onSave(modifiedData)
      setModifiedRows(new Set())
    }
  }

  // 총 너비 계산
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)

  return (
    <div className="excel-table-container" style={{ fontSize: `${fontSize}px` }}>
      {/* 툴바 */}
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 border rounded">
        <button
          onClick={handleSaveClick}
          disabled={modifiedRows.size === 0}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          저장 ({modifiedRows.size}개 수정됨)
        </button>
        <div className="text-sm text-gray-600">
          {currentCell && `셀: ${currentCell.row + 1}행 ${currentCell.col + 1}열`}
        </div>
        <div className="text-sm text-gray-500 ml-auto">
          Ctrl+C: 복사 | Ctrl+V: 붙여넣기 | Ctrl+Z: 실행취소 | F2/Enter: 편집
        </div>
      </div>

      {/* 테이블 컨테이너 */}
      <div 
        ref={containerRef}
        className="border border-gray-300 overflow-auto bg-white"
        style={{ maxHeight: '600px' }}
        onMouseUp={handleMouseUp}
      >
        <table 
          ref={tableRef}
          className="excel-table"
          style={{ 
            width: `${totalWidth}px`,
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            userSelect: 'none'
          }}
        >
          {/* 헤더 */}
          <thead>
            <tr style={{ height: `${rowHeight + 4}px` }}>
              {columns.map((column, colIndex) => (
                <th
                  key={column.key}
                  style={{
                    width: `${column.width}px`,
                    minWidth: `${column.width}px`,
                    maxWidth: `${column.width}px`,
                    padding: '0 4px',
                    backgroundColor: '#f3f4f6',
                    borderRight: '1px solid #d1d5db',
                    borderBottom: '2px solid #9ca3af',
                    fontSize: `${fontSize}px`,
                    fontWeight: 600,
                    textAlign: column.align || 'left',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                style={{ 
                  height: `${rowHeight}px`,
                  backgroundColor: modifiedRows.has(rowIndex) ? '#fef3c7' : 'white'
                }}
              >
                {columns.map((column, colIndex) => {
                  const cellKey = getCellKey(rowIndex, colIndex)
                  const isSelected = selectedCells.has(cellKey)
                  const isEditing = editingCell === cellKey
                  const isCurrent = currentCell?.row === rowIndex && currentCell?.col === colIndex
                  const value = row[column.key]

                  return (
                    <td
                      key={cellKey}
                      style={{
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        padding: '0 4px',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: isSelected ? '#dbeafe' : isCurrent ? '#eff6ff' : 'transparent',
                        outline: isCurrent ? '2px solid #2563eb' : 'none',
                        outlineOffset: '-2px',
                        textAlign: column.align || 'left',
                        cursor: column.editable ? 'cell' : 'default',
                        position: 'relative',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onDoubleClick={() => handleDoubleClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        column.type === 'select' ? (
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleValueChange(rowIndex, colIndex, editValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleValueChange(rowIndex, colIndex, editValue)
                              } else if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                            style={{
                              width: '100%',
                              height: `${rowHeight - 2}px`,
                              border: 'none',
                              outline: '2px solid #2563eb',
                              fontSize: `${fontSize}px`,
                              padding: '0 2px'
                            }}
                            autoFocus
                          >
                            {column.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={column.type || 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleValueChange(rowIndex, colIndex, editValue)}
                            onKeyDown={(e) => {
                              e.stopPropagation()
                              if (e.key === 'Enter' && !e.shiftKey) {
                                handleValueChange(rowIndex, colIndex, editValue)
                              } else if (e.key === 'Escape') {
                                setEditingCell(null)
                              } else if (e.key === 'Tab') {
                                e.preventDefault()
                                handleValueChange(rowIndex, colIndex, editValue)
                              }
                            }}
                            style={{
                              width: '100%',
                              height: `${rowHeight - 2}px`,
                              border: 'none',
                              outline: '2px solid #2563eb',
                              fontSize: `${fontSize}px`,
                              padding: '0 2px',
                              backgroundColor: 'white'
                            }}
                            autoFocus
                          />
                        )
                      ) : (
                        <span>{value}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}