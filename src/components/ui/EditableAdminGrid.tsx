'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui'

interface Column<T = any> {
  key: string
  title: string
  width?: number
  type?: 'text' | 'number' | 'dropdown' | 'checkbox'
  source?: string[]
  readOnly?: boolean | ((row: T) => boolean)
  className?: string | ((row: T) => string)
  align?: 'left' | 'center' | 'right'
  renderer?: (value: any, row: T, rowIndex: number, handleDropdownArrowClick?: (e: React.MouseEvent) => void) => React.ReactNode
}

interface EditableAdminGridProps<T = any> {
  data: T[]
  columns: Column<T>[]
  onDataChange?: (data: T[]) => void
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: any) => void
  onDelete?: (rowIndex: number) => void
  onSave?: () => void
  onDeleteSelected?: (indices: number[]) => void
  onCopy?: (indices: number[]) => void
  height?: string
  rowHeight?: number
  showRowNumbers?: boolean
  enableFilter?: boolean
  enableSort?: boolean
  enableCSVExport?: boolean
  enableCSVImport?: boolean
  enableAddRow?: boolean
  enableDelete?: boolean
  enableCheckbox?: boolean
  enableCopy?: boolean
  globalSearchPlaceholder?: string
  customActions?: React.ReactNode
}

interface CellPosition {
  row: number
  col: string
}

export default function EditableAdminGrid<T extends Record<string, any>>({
  data,
  columns,
  onDataChange,
  onCellEdit,
  onDelete,
  onSave,
  onDeleteSelected,
  onCopy,
  height = '900px',
  rowHeight = 26,
  showRowNumbers = true,
  enableFilter = true,
  enableSort = true,
  enableCSVExport = true,
  enableCSVImport = true,
  enableAddRow = true,
  enableDelete = true,
  enableCheckbox = true,
  enableCopy = true,
  globalSearchPlaceholder = '검색',
  customActions
}: EditableAdminGridProps<T>) {
  const [gridData, setGridData] = useState<T[]>([])
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)

  // readOnly 체크 헬퍼 함수
  const isReadOnly = (column: Column<T>, row: T): boolean => {
    if (typeof column.readOnly === 'function') {
      return column.readOnly(row)
    }
    return column.readOnly ?? false
  }
  const [editValue, setEditValue] = useState('')
  const [isKeyboardEdit, setIsKeyboardEdit] = useState(false) // 키보드 입력으로 시작했는지 추적
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null })
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [history, setHistory] = useState<T[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set())
  const [addedRows, setAddedRows] = useState<Set<number>>(new Set())
  const [copiedRows, setCopiedRows] = useState<Set<number>>(new Set())
  const [hoverCell, setHoverCell] = useState<CellPosition | null>(null)
  const [fillStartCell, setFillStartCell] = useState<CellPosition | null>(null)
  const [fillPreviewData, setFillPreviewData] = useState<T[] | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const isInitialMount = useRef(true)
  const originalDataRef = useRef<T[]>([])

  // data prop 변경 추적을 위한 ref
  const prevDataRef = useRef<T[]>([])

  useEffect(() => {
    // 초기 마운트 시에만 데이터 초기화
    if (isInitialMount.current && data.length > 0) {
      const initialData = JSON.parse(JSON.stringify(data))
      originalDataRef.current = initialData
      setGridData(data)
      setHistory([initialData])
      setHistoryIndex(0)
      prevDataRef.current = data
      isInitialMount.current = false
    } else if (!isInitialMount.current) {
      // 데이터 참조가 변경된 경우 업데이트 (길이 변경 조건 제거)
      if (data !== prevDataRef.current) {
        setGridData(data)
        prevDataRef.current = data

        // 길이가 변경된 경우에만 선택된 행 초기화 (삭제 후 재로딩 시)
        if (data.length !== gridData.length) {
          setSelectedRows(new Set())
          setAddedRows(new Set())
          setCopiedRows(new Set())
          setModifiedCells(new Set())
        }
      }
    }
  }, [data, gridData.length])

  useEffect(() => {
    if (editingCell && inputRef.current) {
      if (inputRef.current instanceof HTMLSelectElement) {
        // 드롭다운을 자동으로 열기
        const selectElement = inputRef.current
        selectElement.focus()
        // 약간의 지연 후 클릭 이벤트 트리거 (브라우저가 포커스를 처리한 후)
        setTimeout(() => {
          if (document.activeElement === selectElement) {
            // 마우스 이벤트로 드롭다운 열기
            const mouseEvent = new MouseEvent('mousedown', {
              view: window,
              bubbles: true,
              cancelable: true
            })
            selectElement.dispatchEvent(mouseEvent)
          }
        }, 50)
      } else {
        inputRef.current.focus()
        // 키보드 입력인 경우 커서를 끝으로 이동, 아니면 선택하지 않음
        if (inputRef.current instanceof HTMLInputElement) {
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      }
    }
  }, [editingCell, isKeyboardEdit])

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z (Undo)
      if (e.ctrlKey && e.key === 'z' && !editingCell) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Ctrl+C (Copy) - 텍스트 선택이 없을 때만 처리
      if (e.ctrlKey && e.key === 'c' && !editingCell) {
        const selection = window.getSelection()
        const hasTextSelection = selection && selection.toString().length > 0

        // 텍스트가 선택되어 있으면 브라우저 기본 동작 허용
        if (hasTextSelection) {
          return
        }

        // 텍스트 선택이 없으면 셀 전체 복사
        e.preventDefault()
        handleCopy()
        return
      }

      // 편집 모드가 아닐 때만 방향키 처리
      if (!editingCell && selectedCell) {
        let newRow = selectedCell.row
        let newColIndex = columns.findIndex(c => c.key === selectedCell.col)

        if (e.key === 'ArrowUp') {
          e.preventDefault()
          newRow = Math.max(0, selectedCell.row - 1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          newRow = Math.min(gridData.length - 1, selectedCell.row + 1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          newColIndex = Math.max(0, newColIndex - 1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          newColIndex = Math.min(columns.length - 1, newColIndex + 1)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          // Enter 키로 편집 시작
          const column = columns.find(c => c.key === selectedCell.col)
          const row = gridData[selectedCell.row]
          if (column && !isReadOnly(column, row)) {
            handleCellDoubleClick(selectedCell.row, selectedCell.col, gridData[selectedCell.row][selectedCell.col])
          }
          return
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // 일반 문자 키를 누르면 즉시 편집 모드로 전환하고 해당 문자 입력
          e.preventDefault()
          const column = columns.find(c => c.key === selectedCell.col)
          const row = gridData[selectedCell.row]
          if (column && !isReadOnly(column, row) && column.type !== 'checkbox') {
            setIsKeyboardEdit(true)
            setEditingCell(selectedCell)
            setEditValue(e.key)
          }
          return
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          // Backspace나 Delete 키를 누르면 셀 값을 비우고 편집 모드로 전환
          e.preventDefault()
          const column = columns.find(c => c.key === selectedCell.col)
          const row = gridData[selectedCell.row]
          if (column && !isReadOnly(column, row)) {
            setIsKeyboardEdit(true)
            setEditingCell(selectedCell)
            setEditValue('')
          }
          return
        }

        if (newRow !== selectedCell.row || newColIndex !== columns.findIndex(c => c.key === selectedCell.col)) {
          setSelectedCell({ row: newRow, col: columns[newColIndex].key })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCell, editingCell, gridData, columns])

  // 붙여넣기 핸들러
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!selectedCell || editingCell) return

    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain')
    if (!text) return

    const newData = [...gridData]
    const newModifiedCells = new Set(modifiedCells)
    let hasChanges = false

    // 줄바꿈과 탭을 모두 공백으로 변환하여 한 셀에 붙여넣기
    const convertedValue = text.trim()
      .split(/\r?\n/).join(' ')  // 줄바꿈을 공백으로
      .split('\t').join(' ')      // 탭을 공백으로
      .replace(/\s+/g, ' ')       // 연속된 공백을 하나로

    const column = columns.find(c => c.key === selectedCell.col)
    const targetRowData = newData[selectedCell.row]

    if (column && !isReadOnly(column, targetRowData)) {
      let processedValue: any = convertedValue
      if (column.type === 'number') {
        processedValue = convertedValue === '' ? null : Number(convertedValue.replace(/,/g, ''))
      }

      newData[selectedCell.row][selectedCell.col] = processedValue

      const cellKey = `${selectedCell.row}-${selectedCell.col}`
      const isAddedOrCopied = addedRows.has(selectedCell.row) || copiedRows.has(selectedCell.row)

      if (!isAddedOrCopied) {
        const originalValue = originalDataRef.current[selectedCell.row]?.[selectedCell.col]
        if (processedValue === originalValue) {
          newModifiedCells.delete(cellKey)
        } else {
          newModifiedCells.add(cellKey)
        }
      }

      hasChanges = true
    }

    if (hasChanges) {
      // 히스토리 추가
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newData)))
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      setModifiedCells(newModifiedCells)
      setGridData(newData)
      onDataChange?.(newData)
    }
  }

  // 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setSelectedCell(null)
        setEditingCell(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 채우기 미리보기 업데이트
  useEffect(() => {
    if (fillStartCell && hoverCell) {
      const startRow = fillStartCell.row
      const endRow = hoverCell.row
      const col = fillStartCell.col

      if (startRow !== endRow && col === hoverCell.col) {
        const previewData = [...gridData]
        const sourceValue = previewData[startRow][col]
        const [minRow, maxRow] = startRow < endRow ? [startRow, endRow] : [endRow, startRow]

        for (let i = minRow + 1; i <= maxRow; i++) {
          previewData[i] = { ...previewData[i], [col]: sourceValue }
        }

        setFillPreviewData(previewData)
      } else {
        setFillPreviewData(null)
      }
    } else {
      setFillPreviewData(null)
    }
  }, [fillStartCell, hoverCell, gridData])

  // 채우기 핸들 드래그
  useEffect(() => {
    const handleMouseUp = () => {
      if (fillStartCell && hoverCell && fillPreviewData) {
        // 드래그 완료 시 값 채우기
        const startRow = fillStartCell.row
        const endRow = hoverCell.row
        const col = fillStartCell.col

        if (startRow !== endRow && col === hoverCell.col) {
          const newData = [...gridData]
          const newModifiedCells = new Set(modifiedCells)
          const sourceValue = newData[startRow][col]
          const [minRow, maxRow] = startRow < endRow ? [startRow, endRow] : [endRow, startRow]

          for (let i = minRow + 1; i <= maxRow; i++) {
            newData[i][col] = sourceValue

            // 원본 데이터와 비교
            const cellKey = `${i}-${col}`
            const originalValue = originalDataRef.current[i]?.[col]
            if (sourceValue === originalValue) {
              newModifiedCells.delete(cellKey)
            } else {
              newModifiedCells.add(cellKey)
            }
          }

          addToHistory(newData)
          setModifiedCells(newModifiedCells)
          setGridData(newData)
          onDataChange?.(newData)
        }
      }
      setFillStartCell(null)
      setFillPreviewData(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fillStartCell) {
        setFillStartCell(null)
        setFillPreviewData(null)
      }
    }

    if (fillStartCell) {
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [fillStartCell, hoverCell, gridData, modifiedCells, onDataChange, fillPreviewData])

  const handleCopy = () => {
    if (!selectedCell) return

    // 단일 셀 선택된 경우만 처리
    const value = gridData[selectedCell.row][selectedCell.col]
    const textToCopy = String(value ?? '')

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
    }
  }

  const handleUndo = () => {
    console.log('Undo called. historyIndex:', historyIndex, 'history.length:', history.length)
    if (historyIndex > 0 && history.length > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const previousData = JSON.parse(JSON.stringify(history[newIndex]))
      console.log('Restoring to index:', newIndex, 'data length:', previousData.length)
      if (previousData && previousData.length > 0) {
        setGridData(previousData)
        onDataChange?.(previousData)

        // Undo 후 modifiedCells 재계산
        const newModifiedCells = new Set<string>()
        previousData.forEach((row, rowIndex) => {
          columns.forEach(column => {
            const currentValue = row[column.key]
            const originalValue = originalDataRef.current[rowIndex]?.[column.key]
            if (currentValue !== originalValue) {
              newModifiedCells.add(`${rowIndex}-${column.key}`)
            }
          })
        })
        setModifiedCells(newModifiedCells)
      }
    }
  }

  const addToHistory = (newData: T[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    // 순환 참조 방지를 위해 안전한 복사 수행
    const safeCopy = newData.map(row => {
      const newRow: any = {}
      Object.keys(row).forEach(key => {
        const value = row[key]
        // 기본 타입과 null만 복사 (함수, DOM 요소 등 제외)
        if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          newRow[key] = value
        } else if (typeof value === 'object' && value !== null && !value.nodeType) {
          // 간단한 객체만 복사 (DOM 요소 제외)
          try {
            newRow[key] = JSON.parse(JSON.stringify(value))
          } catch {
            newRow[key] = value
          }
        }
      })
      return newRow as T
    })
    newHistory.push(safeCopy)
    console.log('Adding to history. New index:', newHistory.length - 1, 'Total history length:', newHistory.length)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleCellClick = (rowIndex: number, columnKey: string, currentValue: any) => {
    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]

    // 이미 선택된 셀을 다시 클릭하면 편집 모드 활성화 (드롭다운 제외)
    if (selectedCell?.row === rowIndex && selectedCell?.col === columnKey && !isReadOnly(column, row) && column?.type !== 'dropdown') {
      setIsKeyboardEdit(false)
      setEditingCell({ row: rowIndex, col: columnKey })
      setEditValue(currentValue ?? '')
    } else {
      // 첫 클릭은 셀 선택만
      setSelectedCell({ row: rowIndex, col: columnKey })
    }
  }

  const handleDropdownArrowClick = (rowIndex: number, columnKey: string, currentValue: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]

    if (column?.type === 'dropdown' && !isReadOnly(column, row)) {
      setEditingCell({ row: rowIndex, col: columnKey })
      setEditValue(currentValue ?? '')
      setSelectedCell({ row: rowIndex, col: columnKey })
    }
  }

  const handleCellDoubleClick = (rowIndex: number, columnKey: string, currentValue: any) => {
    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]
    if (isReadOnly(column, row)) return

    setIsKeyboardEdit(false) // 더블클릭/Enter는 키보드 입력이 아님
    setEditingCell({ row: rowIndex, col: columnKey })
    setEditValue(currentValue ?? '')
  }

  const commitEdit = (valueOverride?: any) => {
    if (!editingCell) return

    const newData = [...gridData]
    const column = columns.find(col => col.key === editingCell.col)

    const rawValue = valueOverride !== undefined ? valueOverride : editValue
    let processedValue: any = rawValue
    if (column?.type === 'number') {
      processedValue = rawValue === '' ? null : Number(rawValue)
    } else if (column?.type === 'checkbox') {
      processedValue = rawValue === 'true' || rawValue === true
    }

    const oldValue = newData[editingCell.row][editingCell.col]
    newData[editingCell.row] = {
      ...newData[editingCell.row],
      [editingCell.col]: processedValue
    }

    // 값이 변경된 경우 수정된 셀 추적
    if (oldValue !== processedValue) {
      const cellKey = `${editingCell.row}-${editingCell.col}`
      const newModifiedCells = new Set(modifiedCells)
      const rowIndex = editingCell.row

      // 추가되거나 복사된 행은 modifiedCells에서 제외
      const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)

      if (!isAddedOrCopied) {
        // 원본 데이터와 비교 (기존 데이터만)
        const originalValue = originalDataRef.current[rowIndex]?.[editingCell.col]
        if (processedValue === originalValue) {
          // 원래 값으로 돌아간 경우 modifiedCells에서 제거
          newModifiedCells.delete(cellKey)
        } else {
          // 원래 값과 다른 경우 modifiedCells에 추가
          newModifiedCells.add(cellKey)
        }
      }

      setModifiedCells(newModifiedCells)
      addToHistory(newData)
    }

    setGridData(newData)
    onDataChange?.(newData)
    onCellEdit?.(editingCell.row, editingCell.col, processedValue)

    // Enter 키로 아래 셀로 이동
    const nextRow = editingCell.row + 1
    if (nextRow < gridData.length) {
      setSelectedCell({ row: nextRow, col: editingCell.col })
    }

    setEditingCell(null)
    setIsKeyboardEdit(false)
  }

  const cancelEdit = () => {
    setIsKeyboardEdit(false)
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation() // 전역 핸들러로 전달되지 않도록 방지
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // 방향키 입력 시 편집 완료하고 셀 이동
      e.preventDefault()
      e.stopPropagation() // 전역 이벤트 핸들러로 버블링 방지

      if (!editingCell) return

      // 현재 편집 내용 커밋
      const newData = [...gridData]
      const column = columns.find(col => col.key === editingCell.col)

      let processedValue: any = editValue
      if (column?.type === 'number') {
        processedValue = editValue === '' ? null : Number(editValue)
      } else if (column?.type === 'checkbox') {
        processedValue = editValue === 'true' || editValue === true
      }

      const oldValue = newData[editingCell.row][editingCell.col]
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [editingCell.col]: processedValue
      }

      if (oldValue !== processedValue) {
        const cellKey = `${editingCell.row}-${editingCell.col}`
        const newModifiedCells = new Set(modifiedCells)
        const rowIndex = editingCell.row
        const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)

        if (!isAddedOrCopied) {
          const originalValue = originalDataRef.current[rowIndex]?.[editingCell.col]
          if (processedValue === originalValue) {
            newModifiedCells.delete(cellKey)
          } else {
            newModifiedCells.add(cellKey)
          }
        }

        setModifiedCells(newModifiedCells)
        addToHistory(newData)
      }

      setGridData(newData)
      onDataChange?.(newData)
      onCellEdit?.(editingCell.row, editingCell.col, processedValue)

      // 방향키에 따라 셀 이동
      let newRow = editingCell.row
      let newColIndex = columns.findIndex(c => c.key === editingCell.col)

      if (e.key === 'ArrowUp') {
        newRow = Math.max(0, editingCell.row - 1)
      } else if (e.key === 'ArrowDown') {
        newRow = Math.min(gridData.length - 1, editingCell.row + 1)
      } else if (e.key === 'ArrowLeft') {
        newColIndex = Math.max(0, newColIndex - 1)
      } else if (e.key === 'ArrowRight') {
        newColIndex = Math.min(columns.length - 1, newColIndex + 1)
      }

      setEditingCell(null)
      setIsKeyboardEdit(false)
      setSelectedCell({ row: newRow, col: columns[newColIndex].key })
    }
  }

  const handleSort = (columnKey: string) => {
    if (!enableSort) return

    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === columnKey) {
      if (sortConfig.direction === 'asc') direction = 'desc'
      else if (sortConfig.direction === 'desc') direction = null
    }

    setSortConfig({ key: columnKey, direction })

    if (direction === null) {
      setGridData([...data])
    } else {
      const sorted = [...gridData].sort((a, b) => {
        const aVal = a[columnKey]
        const bVal = b[columnKey]

        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()

        if (direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
        }
      })
      setGridData(sorted)
    }
  }

  // 전역 검색 필터링 (메모이제이션)
  const filteredData = useMemo(() => {
    if (!globalSearchTerm) return gridData

    const searchLower = globalSearchTerm.toLowerCase()
    return gridData.filter(row => {
      // 검색어와 매칭되는 셀이 있으면 표시
      return columns.some(col => {
        const cellValue = row[col.key]
        return String(cellValue ?? '').toLowerCase().includes(searchLower)
      })
    })
  }, [gridData, globalSearchTerm, columns])

  const exportToCSV = () => {
    const headers = columns.map(col => col.title).join(',')
    const rows = gridData.map(row =>
      columns.map(col => {
        const value = row[col.key]
        const strValue = String(value ?? '')
        return strValue.includes(',') || strValue.includes('"')
          ? `"${strValue.replace(/"/g, '""')}"`
          : strValue
      }).join(',')
    ).join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const importFromCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())

      const imported = lines.slice(1).map(line => {
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"'
              i++
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        const row: any = {}
        columns.forEach((col, idx) => {
          const value = values[idx] || ''
          if (col.type === 'number') {
            row[col.key] = value === '' ? null : Number(value)
          } else if (col.type === 'checkbox') {
            row[col.key] = value === 'true' || value === '1'
          } else {
            row[col.key] = value
          }
        })
        return row as T
      })

      setGridData(imported)
      onDataChange?.(imported)
    }
    reader.readAsText(file)
  }

  // 채우기 핸들 마우스 다운
  const handleFillHandleMouseDown = (rowIndex: number, columnKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFillStartCell({ row: rowIndex, col: columnKey })
    setSelectedCell({ row: rowIndex, col: columnKey })
  }

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}_${Math.random()}`
    } as T
    columns.forEach(column => {
      if (column.key !== 'id') {
        newRow[column.key] = column.type === 'number' ? null : ''
      }
    })
    const newData = [...gridData, newRow]
    setGridData(newData)
    addToHistory(newData)
    onDataChange?.(newData)

    // 새로 추가된 행 인덱스를 addedRows에 추가
    const newIndex = gridData.length
    const newAddedRows = new Set(addedRows)
    newAddedRows.add(newIndex)
    setAddedRows(newAddedRows)
  }


  const formatNumberWithComma = (value: any) => {
    if (value === null || value === undefined || value === '') return ''
    const num = Number(value)
    if (isNaN(num)) return value
    return num.toLocaleString('ko-KR')
  }

  const isNumberColumn = (columnKey: string) => {
    const column = columns.find(c => c.key === columnKey)
    if (column?.type === 'number') return true
    // 금액 관련 필드명으로도 판단
    const numberKeywords = ['price', 'cost', 'fee', 'amount', 'commission', 'rate', 'quantity', 'weight']
    return numberKeywords.some(keyword => columnKey.toLowerCase().includes(keyword))
  }


  const getCellClassName = useCallback((rowIndex: number, columnKey: string, column: Column<T>, row: T, isSticky: boolean = false) => {
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === columnKey
    const cellKey = `${rowIndex}-${columnKey}`
    const isModified = modifiedCells.has(cellKey)
    const isAdded = addedRows.has(rowIndex)
    const isCopied = copiedRows.has(rowIndex)
    const isHovered = hoverCell?.row === rowIndex || hoverCell?.col === columnKey
    const isNumberCol = isNumberColumn(columnKey)
    const isFillRange = fillStartCell && fillStartCell.col === columnKey && (
      (fillStartCell.row <= rowIndex && rowIndex <= (hoverCell?.row ?? -1)) ||
      (fillStartCell.row >= rowIndex && rowIndex >= (hoverCell?.row ?? 999999))
    )
    const isFillPreview = isFillRange && fillPreviewData && rowIndex !== fillStartCell?.row

    // 수동 모드 체크: 셀러공급가, 네이버/쿠팡 가격
    const isManualMode =
      (columnKey === 'seller_supply_price' && (row['seller_supply_price_mode'] === 'manual' || row['seller_supply_price_mode'] === '수동')) ||
      (columnKey === 'naver_paid_shipping_price' && (row['naver_price_mode'] === 'manual' || row['naver_price_mode'] === '수동')) ||
      (columnKey === 'naver_free_shipping_price' && (row['naver_price_mode'] === 'manual' || row['naver_price_mode'] === '수동')) ||
      (columnKey === 'coupang_paid_shipping_price' && (row['coupang_price_mode'] === 'manual' || row['coupang_price_mode'] === '수동')) ||
      (columnKey === 'coupang_free_shipping_price' && (row['coupang_price_mode'] === 'manual' || row['coupang_price_mode'] === '수동'))

    let classes = 'border border-gray-200 px-2 py-1 relative overflow-hidden align-middle '

    // 폰트 크기
    classes += 'text-[13px] '

    // 줄바꿈 방지 및 말줄임표
    classes += 'whitespace-nowrap text-ellipsis '

    // 수정된 셀은 빨간색, 추가된 행은 초록색, 복사된 행은 파란색 폰트
    // 수동 모드는 보라색
    if (isManualMode && !isModified && !isFillPreview) {
      classes += 'text-purple-600 dark:text-purple-400 '
    } else if (isModified || isFillPreview) {
      classes += 'text-red-600 dark:text-red-500 '
    } else if (isAdded) {
      classes += 'text-green-600 dark:text-green-500 '
    } else if (isCopied) {
      classes += 'text-blue-600 dark:text-blue-500 '
    }

    // 선택된 셀
    if (isSelected) {
      classes += 'ring-2 ring-blue-500 ring-inset z-20 bg-blue-100 '
    }
    // 채우기 범위
    else if (isFillRange) {
      classes += 'bg-red-50 ring-1 ring-red-400 ring-inset '
    }
    // 호버된 행/열
    else if (isHovered && !isSelected && !fillStartCell) {
      classes += 'bg-gray-200 '
    }
    // sticky 열의 기본 배경색
    else if (isSticky) {
      classes += 'bg-white '
    }

    // 정렬
    if (column.align) {
      classes += `text-${column.align} `
    } else if (isNumberCol) {
      classes += 'text-right '
    } else {
      classes += 'text-center '
    }

    // readOnly 셀
    if (!column.readOnly) {
      classes += 'cursor-cell '
    }

    // className (함수형 또는 문자열 지원)
    if (column.className) {
      let customClass = ''
      if (typeof column.className === 'function') {
        customClass = column.className(row)
      } else {
        customClass = column.className.replace(/bg-\w+-\d+/g, '').trim()
      }
      if (customClass) {
        classes += customClass + ' '
      }
    }

    return classes.trim()
  }, [selectedCell, modifiedCells, addedRows, copiedRows, hoverCell, fillStartCell, fillPreviewData])

  const renderCell = (row: T, column: Column<T>, rowIndex: number) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.key
    // 미리보기 데이터가 있으면 사용, 없으면 원본 데이터 사용
    const displayRow = fillPreviewData ? fillPreviewData[rowIndex] : row
    const value = displayRow[column.key]
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === column.key
    const isNumberCol = isNumberColumn(column.key)

    if (isEditing) {
      if (column.type === 'dropdown' && column.source) {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => {
              const newValue = e.target.value
              setEditValue(newValue)
              // 값 선택 후 즉시 커밋 (새 값을 직접 전달)
              setTimeout(() => commitEdit(newValue), 0)
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-full px-2 py-1 border-none outline-none bg-transparent text-[13px] text-center"
            style={{ fontSize: '13px', margin: 0 }}
          >
            <option value="">선택</option>
            {column.source.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      } else if (column.type === 'checkbox') {
        return (
          <div className="flex items-center justify-center h-full">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="checkbox"
              checked={editValue === 'true' || editValue === true}
              onChange={(e) => setEditValue(String(e.target.checked))}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-4 h-4"
            />
          </div>
        )
      } else {
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className={`w-full h-full px-2 py-1 border-none outline-none bg-transparent resize-none overflow-hidden ${
              isNumberCol ? 'text-right' : 'text-center'
            }`}
            style={{
              fontSize: '13px',
              margin: 0,
              lineHeight: 'normal'
            }}
          />
        )
      }
    }

    if (column.renderer) {
      const dropdownArrowClickHandler = (e: React.MouseEvent) => {
        handleDropdownArrowClick(rowIndex, column.key, value, e)
      }

      return (
        <>
          {column.renderer(value, row, rowIndex, dropdownArrowClickHandler)}
          {isSelected && !isReadOnly(column, row) && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 z-30"
              style={{ margin: '-1px', cursor: 'crosshair' }}
              onMouseDown={(e) => handleFillHandleMouseDown(rowIndex, column.key, e)}
            />
          )}
        </>
      )
    }

    if (column.type === 'checkbox') {
      return (
        <div className="flex items-center justify-center h-full">
          <input type="checkbox" checked={!!value} readOnly className="w-4 h-4" />
        </div>
      )
    }

    if (column.type === 'dropdown' && column.source) {
      return (
        <div className="relative flex items-center justify-center h-full w-full">
          <span style={{ fontSize: '13px' }}>{value ?? ''}</span>
          <div
            className="absolute right-1 w-5 h-full flex items-center justify-center cursor-pointer"
            onClick={(e) => handleDropdownArrowClick(rowIndex, column.key, value, e)}
            style={{ zIndex: 10 }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ opacity: 0.5 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {isSelected && !isReadOnly(column, row) && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 z-30"
              style={{ margin: '-1px', cursor: 'crosshair' }}
              onMouseDown={(e) => handleFillHandleMouseDown(rowIndex, column.key, e)}
            />
          )}
        </div>
      )
    }

    const displayValue = isNumberColumn(column.key) ? formatNumberWithComma(value) : (value ?? '')

    return (
      <>
        <span style={{ fontSize: '13px' }}>{displayValue}</span>
        {isSelected && !isReadOnly(column, row) && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 z-30"
            style={{ margin: '-1px', cursor: 'crosshair' }}
            onMouseDown={(e) => handleFillHandleMouseDown(rowIndex, column.key, e)}
          />
        )}
      </>
    )
  }

  const modifiedCount = modifiedCells.size

  const handleToggleAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredData.map((_, idx) => idx)))
    }
  }

  const handleToggleRow = (rowIndex: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex)
    } else {
      newSelected.add(rowIndex)
    }
    setSelectedRows(newSelected)
  }

  const handleSaveClick = () => {
    if (onSave) {
      onSave()
    }
  }

  const handleDeleteSelectedClick = () => {
    if (onDeleteSelected) {
      onDeleteSelected(Array.from(selectedRows))
    }
  }

  const handleCopyClick = () => {
    // 선택된 행들을 복사해서 바로 아래에 추가
    const selectedIndices = Array.from(selectedRows).sort((a, b) => a - b)
    const copiedRowsList: T[] = []

    selectedIndices.forEach(index => {
      const originalRow = gridData[index]
      const copiedRow = { ...originalRow, id: `temp_${Date.now()}_${Math.random()}` }
      copiedRowsList.push(copiedRow as T)
    })

    const newData = [...gridData, ...copiedRowsList]

    // 복사된 행 인덱스를 copiedRows에 추가
    const newCopiedRows = new Set(copiedRows)
    copiedRowsList.forEach((row, idx) => {
      const rowIndex = gridData.length + idx
      newCopiedRows.add(rowIndex)
    })

    setCopiedRows(newCopiedRows)
    setGridData(newData)
    addToHistory(newData)
    onDataChange?.(newData)
    setSelectedRows(new Set())

    // 콜백이 있으면 호출 (추가 로직용)
    if (onCopy) {
      onCopy(Array.from(selectedRows))
    }
  }

  return (
    <div className="space-y-2">
      {(enableFilter || enableCSVExport || enableCSVImport || onSave || onDeleteSelected || enableCopy || customActions) && (
        <div className="flex gap-2 items-center">
          {enableFilter && (
            <div className="relative" style={{ width: '200px' }}>
              <input
                type="text"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder={globalSearchPlaceholder}
                className="w-full border border-gray-200 rounded px-3 pr-8"
                style={{ height: '32px' }}
              />
              <svg
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          )}
          {enableCSVExport && (
            <button
              onClick={exportToCSV}
              className="p-1 border border-gray-200 rounded hover:bg-surface-hover"
              title="엑셀 다운로드"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M9.5 13.5L12 16l2.5-2.5M12 10v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {enableCSVImport && (
            <label className="cursor-pointer p-1 border border-gray-200 rounded hover:bg-gray-50" title="엑셀 업로드">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && importFromCSV(e.target.files[0])}
                className="hidden"
              />
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M12 10v6m-2.5-3.5L12 10l2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </label>
          )}
          <div className="flex-1"></div>
          {customActions}
          {modifiedCount > 0 && (
            <span className="text-sm text-text-secondary">수정 {modifiedCount}건</span>
          )}
          {addedRows.size > 0 && (
            <span className="text-sm text-success">추가 {addedRows.size}건</span>
          )}
          {copiedRows.size > 0 && (
            <span className="text-sm text-primary">복사 {copiedRows.size}건</span>
          )}
          {onSave && (
            <button
              onClick={handleSaveClick}
              disabled={modifiedCount === 0 && addedRows.size === 0 && copiedRows.size === 0}
              className={`px-2 py-1 rounded text-xs ${
                modifiedCount > 0 || addedRows.size > 0 || copiedRows.size > 0
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          )}
          {selectedRows.size > 0 && onDeleteSelected && (
            <button
              onClick={handleDeleteSelectedClick}
              className="px-2 py-1 bg-danger text-white rounded text-xs hover:bg-danger-hover"
            >
              삭제
            </button>
          )}
          {selectedRows.size > 0 && enableCopy && (
            <button
              onClick={handleCopyClick}
              className="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary-hover"
            >
              복사
            </button>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="overflow-auto bg-surface border-b border-gray-200"
        style={{ maxHeight: height, height: 'auto' }}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <table ref={tableRef} className="w-full border-collapse" style={{ fontSize: '13px', borderSpacing: 0 }}>
          <thead className="sticky top-0 bg-gray-50" style={{ zIndex: 30, boxShadow: 'inset 0 1px 0 0 #e5e7eb' }}>
            <tr>
              {enableCheckbox && (
                <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-center align-middle sticky top-0" style={{ width: 40, fontSize: '13px', zIndex: 31 }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={handleToggleAll}
                    className="cursor-pointer align-middle"
                  />
                </th>
              )}
              {showRowNumbers && (
                <th className="border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-text-secondary whitespace-nowrap sticky top-0" style={{ width: 50, fontSize: '13px', zIndex: 31 }}>
                  {enableAddRow && (
                    <button
                      onClick={handleAddRow}
                      className="text-primary hover:text-blue-800 dark:hover:text-blue-300 font-normal"
                      style={{ fontSize: '13px' }}
                      title="행 추가"
                    >
                      +행추가
                    </button>
                  )}
                </th>
              )}
              {columns.map((column, colIdx) => {
                return (
                  <th
                    key={column.key}
                    className="border border-gray-200 px-2 py-1 font-semibold text-text whitespace-nowrap bg-gray-50 sticky top-0"
                    style={{
                      width: column.width,
                      fontSize: '13px',
                      zIndex: 31
                    }}
                  >
                    <div
                      className={`flex items-center justify-center gap-1 ${enableSort ? 'cursor-pointer hover:text-primary' : ''}`}
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.title}</span>
                      {enableSort && sortConfig.key === column.key && (
                        <span className="text-primary">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
              {enableDelete && (
                <th
                  className="border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-text whitespace-nowrap sticky top-0"
                  style={{ width: 100, fontSize: '13px', zIndex: 31 }}
                >
                  삭제
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {enableCheckbox && (
                  <td className="border border-gray-200 px-2 py-1 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => handleToggleRow(rowIndex)}
                      className="cursor-pointer align-middle"
                    />
                  </td>
                )}
                {showRowNumbers && (
                  <td className="border border-gray-200 px-2 py-1 text-xs text-center align-middle text-text-tertiary">
                    {rowIndex + 1}
                  </td>
                )}
                {columns.map((column, colIdx) => {
                  return (
                    <td
                      key={column.key}
                      className={getCellClassName(rowIndex, column.key, column, row, false)}
                      style={{
                        height: rowHeight,
                        userSelect: 'text'
                      }}
                      onClick={() => handleCellClick(rowIndex, column.key, row[column.key])}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, column.key, row[column.key])}
                      onMouseEnter={() => setHoverCell({ row: rowIndex, col: column.key })}
                      onMouseLeave={() => !fillStartCell && setHoverCell(null)}
                    >
                      {renderCell(row, column, rowIndex)}
                    </td>
                  )
                })}
                {enableDelete && (
                  <td className="border border-gray-200 px-2 py-1 text-center align-middle" style={{ height: rowHeight, width: 100 }}>
                    <button
                      onClick={() => onDelete?.(rowIndex)}
                      className="px-3 py-0.5 bg-danger-100 text-danger rounded hover:bg-danger-200 whitespace-nowrap"
                      style={{ fontSize: '13px', minWidth: '50px' }}
                    >
                      삭제
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
