'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo, startTransition } from 'react'
import { Button } from '@/components/ui'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

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
  cellStyle?: (value: any, row: T, rowIndex: number) => React.CSSProperties
}

interface EditableAdminGridProps<T = any> {
  data: T[]
  columns: Column<T>[]
  onDataChange?: (data: T[]) => void
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: any) => void
  onDelete?: (rowIndex: number) => void
  onSave?: (modifiedRows?: T[]) => void
  onDeleteSelected?: (indices: number[]) => void
  onCopy?: (indices: number[]) => void
  onSelectionChange?: (indices: number[]) => void  // 선택된 행이 변경될 때 호출
  onModifiedChange?: (hasModifications: boolean) => void  // 수정 상태 변경 콜백
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void  // 스크롤 이벤트 핸들러
  forceModified?: boolean  // 외부에서 강제로 수정 상태 표시 (토글 버튼 등)
  // 엑셀 업로드 자동 저장 (이 옵션들이 있으면 모달에서 바로 DB 저장)
  tableName?: string  // Supabase 테이블 이름 (있으면 엑셀 업로드 시 자동 저장)
  onDataReload?: () => Promise<void>  // 저장 완료 후 데이터 재조회 함수
  validateRow?: (row: T) => boolean  // 행 유효성 검사 (false 반환 시 해당 행 스킵)
  excludeEmptyColumns?: string[]  // 모든 값이 비어있으면 스킵할 컬럼들 (예: ['category_1', 'category_2'])
  transformBeforeSave?: (row: T) => T  // DB 저장 전 데이터 변환 함수 (예: 이름→ID 변환)
  height?: string
  rowHeight?: number
  showRowNumbers?: boolean
  startIndex?: number  // 페이지네이션용 시작 인덱스 (기본값 0)
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
  exportFilePrefix?: string
  mergeKeyGetter?: (row: T) => string  // 병합 모드에서 중복 체크를 위한 키 생성 함수
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
  onSelectionChange,
  onModifiedChange,
  onScroll,
  forceModified = false,
  tableName,
  onDataReload,
  validateRow,
  excludeEmptyColumns,
  transformBeforeSave,
  height = '900px',
  rowHeight = 26,
  showRowNumbers = true,
  startIndex = 0,
  enableFilter = true,
  enableSort = true,
  enableCSVExport = true,
  enableCSVImport = true,
  enableAddRow = true,
  enableDelete = true,
  enableCheckbox = true,
  enableCopy = true,
  globalSearchPlaceholder = '검색',
  customActions,
  exportFilePrefix = 'export',
  mergeKeyGetter
}: EditableAdminGridProps<T>) {
  const [gridData, setGridData] = useState<T[]>([])
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()) // 다중 셀 선택 (row-col 형식)
  const [isDragging, setIsDragging] = useState(false) // 드래그 중 여부
  const [dragStartCell, setDragStartCell] = useState<CellPosition | null>(null) // 드래그 시작 셀
  const [hasDragged, setHasDragged] = useState(false) // 실제로 드래그 했는지 여부 (클릭과 구분)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number>(0)
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0)

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
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set()) // ID 기반 선택 (인덱스 대신)
  const [history, setHistory] = useState<T[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set())
  const [addedRows, setAddedRows] = useState<Set<number>>(new Set())
  const [copiedRows, setCopiedRows] = useState<Set<number>>(new Set())
  const [showImportModeDialog, setShowImportModeDialog] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [hoverCell, setHoverCell] = useState<CellPosition | null>(null)
  const [fillStartCell, setFillStartCell] = useState<CellPosition | null>(null)
  const [fillPreviewData, setFillPreviewData] = useState<T[] | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const isInitialMount = useRef(true)
  const originalDataRef = useRef<T[]>([])
  const isInternalUpdate = useRef(false) // 내부 업데이트 플래그

  // data prop 변경 추적을 위한 ref
  const prevDataRef = useRef<T[]>([])

  // ID 기반 선택을 위한 헬퍼 함수
  const getRowId = useCallback((row: T): string => {
    return String(row.id ?? `temp_${Date.now()}_${Math.random()}`)
  }, [])

  // 컬럼 너비 초기화 (컨텐츠 기반 자동 계산)
  useEffect(() => {
    const initialWidths: Record<string, number> = {}
    columns.forEach(column => {
      if (column.width) {
        initialWidths[column.key] = column.width
      } else {
        // 컨텐츠 기반 자동 계산
        const headerWidth = column.title.length * 10 + 40
        const maxContentWidth = Math.max(
          ...data.slice(0, 100).map(row => {
            const value = String(row[column.key] || '')
            return value.length * 8 + 40
          }),
          0
        )
        initialWidths[column.key] = Math.max(Math.min(maxContentWidth, 400), headerWidth, 100)
      }
    })
    setColumnWidths(initialWidths)
  }, [columns, data])

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
      // 데이터 참조가 변경된 경우 업데이트 (외부에서 새로 로드하거나 상태가 변경된 경우)
      if (data !== prevDataRef.current) {
        // 내부 업데이트로 인한 변경인 경우 무시
        if (isInternalUpdate.current) {
          console.log('[EditableAdminGrid] Internal update detected, skipping reset')
          isInternalUpdate.current = false
          prevDataRef.current = data
          return
        }

        console.log('[EditableAdminGrid] External data change detected, resetting modified state')
        const prevLength = prevDataRef.current.length
        const newLength = data.length

        setGridData(data)
        prevDataRef.current = data

        // 항상 modifiedCells 초기화 (데이터가 새로 로드되었으므로)
        // addedRows, copiedRows도 초기화 (새 데이터에는 추가/복사 표시 불필요)
        setModifiedCells(new Set())
        setAddedRows(new Set())
        setCopiedRows(new Set())

        // 원본 데이터 업데이트 (새로 로드된 데이터가 기준점)
        originalDataRef.current = JSON.parse(JSON.stringify(data))

        // 데이터 길이가 증가한 경우만 선택 초기화 (새 데이터 로드 또는 추가)
        // 길이가 같거나 감소한 경우는 선택 유지 (fetchOrders 후 선택 유지)
        if (newLength > prevLength) {
          setSelectedRowIds(new Set())
        }
      }
    }
  }, [data, selectedRowIds.size])

  // 수정 상태 변경 시 콜백 호출
  useEffect(() => {
    const hasModifications = modifiedCells.size > 0 || addedRows.size > 0 || copiedRows.size > 0
    onModifiedChange?.(hasModifications)
  }, [modifiedCells.size, addedRows.size, copiedRows.size, onModifiedChange])

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
        // 포커스 및 텍스트 선택
        inputRef.current.focus()
        if (inputRef.current instanceof HTMLInputElement) {
          if (isKeyboardEdit) {
            // 키보드로 시작한 경우 커서를 끝에 위치
            const length = inputRef.current.value.length
            inputRef.current.setSelectionRange(length, length)
          } else {
            // F2, Enter, 더블클릭으로 시작한 경우 전체 선택
            inputRef.current.select()
          }
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
        } else if (e.key === 'F2') {
          // F2 키로 편집 모드 진입 (Excel 방식)
          e.preventDefault()
          const column = columns.find(c => c.key === selectedCell.col)
          const row = gridData[selectedCell.row]
          if (column && !isReadOnly(column, row)) {
            handleCellDoubleClick(selectedCell.row, selectedCell.col, gridData[selectedCell.row][selectedCell.col])
          }
          return
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          // Backspace나 Delete 키를 누르면 셀 값을 바로 삭제 (편집 모드로 전환하지 않음)
          console.log('[Global Delete] Delete key pressed')
          e.preventDefault()

          const newData = [...gridData]
          const newModifiedCells = new Set(modifiedCells)
          let hasChanges = false

          // 다중 셀 선택이 있는 경우
          if (selectedCells.size > 0) {
            console.log('[Global Delete] Multiple cells selected:', selectedCells.size)
            selectedCells.forEach(cellKey => {
              const [rowStr, colKey] = cellKey.split('-')
              const rowIndex = parseInt(rowStr)
              const column = columns.find(c => c.key === colKey)
              const row = gridData[rowIndex]

              if (column && !isReadOnly(column, row)) {
                const emptyValue = column.type === 'number' ? null : ''
                newData[rowIndex] = {
                  ...newData[rowIndex],
                  [colKey]: emptyValue
                }

                // 수정 추적
                const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)
                if (!isAddedOrCopied) {
                  const originalValue = originalDataRef.current[rowIndex]?.[colKey]
                  const originalHasValue = originalValue !== null && originalValue !== undefined && originalValue !== ''

                  if (emptyValue === originalValue) {
                    newModifiedCells.delete(cellKey)
                  } else if (originalHasValue || emptyValue !== originalValue) {
                    newModifiedCells.add(cellKey)
                  }
                }
                hasChanges = true
              }
            })
          }
          // 단일 셀 선택인 경우
          else if (selectedCell) {
            const column = columns.find(c => c.key === selectedCell.col)
            const row = gridData[selectedCell.row]
            if (column && !isReadOnly(column, row)) {
              console.log('[Global Delete] Single cell, column found, not readonly')
              newData[selectedCell.row] = {
                ...newData[selectedCell.row],
                [selectedCell.col]: column.type === 'number' ? null : ''
              }

              // 수정 추적
              const cellKey = `${selectedCell.row}-${selectedCell.col}`
              const isAddedOrCopied = addedRows.has(selectedCell.row) || copiedRows.has(selectedCell.row)

              if (!isAddedOrCopied) {
                const originalValue = originalDataRef.current[selectedCell.row]?.[selectedCell.col]
                const newValue = column.type === 'number' ? null : ''
                const originalHasValue = originalValue !== null && originalValue !== undefined && originalValue !== ''

                if (newValue === originalValue) {
                  newModifiedCells.delete(cellKey)
                } else if (originalHasValue) {
                  newModifiedCells.add(cellKey)
                } else if (newValue !== originalValue) {
                  newModifiedCells.add(cellKey)
                }
              }
              hasChanges = true
            }
          }

          if (hasChanges) {
            // 내부 업데이트 플래그 먼저 설정
            console.log('[Global Delete] Setting isInternalUpdate to true, modifiedCells size:', newModifiedCells.size)
            isInternalUpdate.current = true

            // React 18의 자동 배칭을 활용하여 상태 업데이트
            setModifiedCells(newModifiedCells)
            setGridData(newData)
            addToHistory(newData)

            // 다음 틱에 콜백 실행 (상태 업데이트 완료 후)
            setTimeout(() => {
              console.log('[Global Delete] Calling onDataChange in setTimeout')
              onDataChange?.(newData)
            }, 0)
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

      // 현재 값 저장
      const currentValue = newData[selectedCell.row][selectedCell.col]

      // 새 값 설정
      newData[selectedCell.row] = {
        ...newData[selectedCell.row],
        [selectedCell.col]: processedValue
      }

      const cellKey = `${selectedCell.row}-${selectedCell.col}`
      const isAddedOrCopied = addedRows.has(selectedCell.row) || copiedRows.has(selectedCell.row)

      // 값이 실제로 변경되었는지 확인
      if (currentValue !== processedValue) {
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
    }

    if (hasChanges) {
      // 상태 업데이트 순서 보장
      setModifiedCells(newModifiedCells)
      setGridData(newData)

      // 히스토리 추가
      addToHistory(newData)

      // 내부 업데이트 플래그 설정
      if (onDataChange) {
        isInternalUpdate.current = true
        onDataChange(newData)
      }
    }
  }

  // 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        // 편집 중이던 내용 저장
        if (editingCell) {
          commitEdit()
        }
        setSelectedCell(null)
        setEditingCell(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingCell, editValue, gridData, columns, modifiedCells, addedRows, copiedRows])

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

  // 드래그 선택 종료
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setDragStartCell(null)
        // hasDragged는 handleCellClick에서 초기화
      }
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

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
    if (historyIndex > 0 && history.length > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const previousData = JSON.parse(JSON.stringify(history[newIndex]))
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

  // 컬럼 리사이징 핸들러
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[columnKey] || 100)
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff)
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

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
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // 셀에서 마우스 다운 시작
  const handleCellMouseDown = (rowIndex: number, columnKey: string, e: React.MouseEvent) => {
    // 텍스트 선택이 있으면 무시
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      return
    }

    // 편집 중이면 무시
    if (editingCell) {
      return
    }

    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]

    // 체크박스나 readOnly 셀은 드래그 선택 불가
    if (column?.type === 'checkbox' || isReadOnly(column, row)) {
      return
    }

    // Ctrl/Shift 키 없이만 드래그 시작
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault() // 기본 동작 방지
      setIsDragging(true)
      setHasDragged(false)
      setDragStartCell({ row: rowIndex, col: columnKey })
      setSelectedCell({ row: rowIndex, col: columnKey })
      setSelectedCells(new Set([`${rowIndex}-${columnKey}`]))
    }
  }

  // 드래그 중 셀 위로 마우스 이동
  const handleCellMouseEnter = (rowIndex: number, columnKey: string) => {
    if (!isDragging || !dragStartCell) {
      return
    }

    // 시작 셀과 다른 셀로 이동했으면 드래그로 간주
    if (dragStartCell.row !== rowIndex || dragStartCell.col !== columnKey) {
      setHasDragged(true)
    }

    // 드래그 범위 계산
    const startRow = Math.min(dragStartCell.row, rowIndex)
    const endRow = Math.max(dragStartCell.row, rowIndex)
    const startColIdx = Math.min(
      columns.findIndex(c => c.key === dragStartCell.col),
      columns.findIndex(c => c.key === columnKey)
    )
    const endColIdx = Math.max(
      columns.findIndex(c => c.key === dragStartCell.col),
      columns.findIndex(c => c.key === columnKey)
    )

    const newSelectedCells = new Set<string>()
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startColIdx; c <= endColIdx; c++) {
        newSelectedCells.add(`${r}-${columns[c].key}`)
      }
    }

    setSelectedCells(newSelectedCells)
  }

  const handleCellClick = (rowIndex: number, columnKey: string, currentValue: any, e: React.MouseEvent) => {
    // 드래그 후 클릭은 무시 (드래그 선택만 적용)
    if (hasDragged) {
      setHasDragged(false)
      return
    }

    // 텍스트 선택이 있으면 클릭 이벤트 무시
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      return
    }

    // 다른 셀을 클릭할 때 편집 중이던 내용 저장
    if (editingCell && (editingCell.row !== rowIndex || editingCell.col !== columnKey)) {
      commitEdit()
    }

    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]
    const cellKey = `${rowIndex}-${columnKey}`

    // 체크박스는 클릭 한 번에 즉시 토글
    if (column?.type === 'checkbox' && !isReadOnly(column, row)) {
      const newValue = !currentValue
      const newData = [...gridData]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnKey]: newValue
      }

      // 수정 추적
      const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)
      const newModifiedCells = new Set(modifiedCells)

      if (!isAddedOrCopied) {
        const originalValue = originalDataRef.current[rowIndex]?.[columnKey]
        if (newValue === originalValue) {
          newModifiedCells.delete(cellKey)
        } else {
          newModifiedCells.add(cellKey)
        }
      }

      // 즉시 상태 업데이트 (딜레이 없음)
      setGridData(newData)
      setModifiedCells(newModifiedCells)
      setSelectedCell({ row: rowIndex, col: columnKey })

      // 히스토리와 콜백은 다음 프레임에
      requestAnimationFrame(() => {
        addToHistory(newData)
        if (onDataChange) {
          isInternalUpdate.current = true
          onDataChange(newData)
        }
      })

      return
    }

    // Ctrl+클릭: 다중 셀 선택 토글
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const newSelectedCells = new Set(selectedCells)

      if (newSelectedCells.has(cellKey)) {
        newSelectedCells.delete(cellKey)
      } else {
        newSelectedCells.add(cellKey)
      }

      setSelectedCells(newSelectedCells)
      setSelectedCell({ row: rowIndex, col: columnKey })
      return
    }

    // Shift+클릭: 범위 선택
    if (e.shiftKey && selectedCell) {
      e.preventDefault()
      const newSelectedCells = new Set<string>()

      const startRow = Math.min(selectedCell.row, rowIndex)
      const endRow = Math.max(selectedCell.row, rowIndex)
      const startColIdx = Math.min(
        columns.findIndex(c => c.key === selectedCell.col),
        columns.findIndex(c => c.key === columnKey)
      )
      const endColIdx = Math.max(
        columns.findIndex(c => c.key === selectedCell.col),
        columns.findIndex(c => c.key === columnKey)
      )

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          newSelectedCells.add(`${r}-${columns[c].key}`)
        }
      }

      setSelectedCells(newSelectedCells)
      return
    }

    // 일반 클릭: 다중 선택 해제
    setSelectedCells(new Set())

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

    // 다른 셀을 편집 중이면 저장
    if (editingCell && (editingCell.row !== rowIndex || editingCell.col !== columnKey)) {
      commitEdit()
    }

    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]

    if (column?.type === 'dropdown' && !isReadOnly(column, row)) {
      setEditingCell({ row: rowIndex, col: columnKey })
      setEditValue(currentValue ?? '')
      setSelectedCell({ row: rowIndex, col: columnKey })
    }
  }

  const handleCellDoubleClick = (rowIndex: number, columnKey: string, currentValue: any) => {
    // 다른 셀을 편집 중이면 저장
    if (editingCell && (editingCell.row !== rowIndex || editingCell.col !== columnKey)) {
      commitEdit()
    }

    const column = columns.find(col => col.key === columnKey)
    const row = gridData[rowIndex]
    if (isReadOnly(column, row)) return

    setIsKeyboardEdit(false) // 더블클릭/Enter는 키보드 입력이 아님
    setEditingCell({ row: rowIndex, col: columnKey })
    setEditValue(currentValue ?? '')
  }

  const commitEdit = useCallback((valueOverride?: any) => {
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

    const cellKey = `${editingCell.row}-${editingCell.col}`
    const rowIndex = editingCell.row

    // 추가되거나 복사된 행은 modifiedCells에서 제외
    const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)

    // 원본 데이터와 비교하여 변경 여부 확인
    const originalValue = originalDataRef.current[rowIndex]?.[editingCell.col]
    const currentValue = newData[editingCell.row][editingCell.col]

    // 데이터 업데이트
    newData[editingCell.row] = {
      ...newData[editingCell.row],
      [editingCell.col]: processedValue
    }

    // 수정 상태 추적 (추가/복사된 행이 아닌 경우만)
    const newModifiedCells = new Set(modifiedCells)

    if (!isAddedOrCopied) {
      // 원본 데이터와 비교 (null, undefined, "" 를 같은 것으로 취급)
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return null
        return val
      }

      const normalizedProcessed = normalizeValue(processedValue)
      const normalizedOriginal = normalizeValue(originalValue)
      const isValueChanged = normalizedProcessed !== normalizedOriginal

      // 디버깅용 로그
      if (column?.type === 'dropdown') {
        console.log('[Dropdown 변경]', {
          column: editingCell.col,
          processedValue,
          originalValue,
          isValueChanged,
          cellKey
        })
      }

      if (!isValueChanged) {
        // 원래 값으로 돌아간 경우 modifiedCells에서 제거
        newModifiedCells.delete(cellKey)
      } else {
        // 원래 값과 다른 경우 modifiedCells에 추가
        newModifiedCells.add(cellKey)
      }
    }

    setModifiedCells(newModifiedCells)
    addToHistory(newData)
    setGridData(newData)

    // 내부 업데이트 플래그 설정 (onDataChange로 인한 재렌더링에서 modifiedCells 초기화 방지)
    if (onDataChange) {
      isInternalUpdate.current = true
      onDataChange(newData)
    }

    onCellEdit?.(editingCell.row, editingCell.col, processedValue)

    // Enter 키로 아래 셀로 이동
    const nextRow = editingCell.row + 1
    if (nextRow < gridData.length) {
      setSelectedCell({ row: nextRow, col: editingCell.col })
    }

    setEditingCell(null)
    setIsKeyboardEdit(false)
  }, [editingCell, editValue, gridData, columns, addedRows, copiedRows, modifiedCells, onDataChange, onCellEdit])

  const cancelEdit = useCallback(() => {
    setIsKeyboardEdit(false)
    setEditingCell(null)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation() // 전역 핸들러로 전달되지 않도록 방지
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // 상하 방향키: 편집 완료하고 셀 이동
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

      // 값이 변경된 경우에만 처리
      if (oldValue !== processedValue) {
        newData[editingCell.row] = {
          ...newData[editingCell.row],
          [editingCell.col]: processedValue
        }

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

        // 내부 업데이트 플래그 먼저 설정
        isInternalUpdate.current = true

        setModifiedCells(newModifiedCells)
        setGridData(newData)
        addToHistory(newData)

        onDataChange?.(newData)
        onCellEdit?.(editingCell.row, editingCell.col, processedValue)
      }

      // 방향키에 따라 셀 이동
      let newRow = editingCell.row

      if (e.key === 'ArrowUp') {
        newRow = Math.max(0, editingCell.row - 1)
      } else if (e.key === 'ArrowDown') {
        newRow = Math.min(gridData.length - 1, editingCell.row + 1)
      }

      setEditingCell(null)
      setIsKeyboardEdit(false)
      setSelectedCell({ row: newRow, col: editingCell.col })
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // 좌우 방향키: 편집 모드에서는 커서 이동만 허용
      const column = columns.find(col => col.key === editingCell?.col)

      if (column?.type === 'dropdown' || column?.type === 'checkbox') {
        // 드롭다운/체크박스는 좌우 방향키로 셀 이동
        e.preventDefault()
        e.stopPropagation()

        if (!editingCell) return

        // 현재 편집 내용 커밋
        const newData = [...gridData]

        let processedValue: any = editValue
        if (column?.type === 'checkbox') {
          processedValue = editValue === 'true' || editValue === true
        }

        const oldValue = newData[editingCell.row][editingCell.col]

        // 값이 변경된 경우에만 처리
        if (oldValue !== processedValue) {
          newData[editingCell.row] = {
            ...newData[editingCell.row],
            [editingCell.col]: processedValue
          }

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

          // 내부 업데이트 플래그 먼저 설정
          isInternalUpdate.current = true

          setModifiedCells(newModifiedCells)
          setGridData(newData)
          addToHistory(newData)

          onDataChange?.(newData)
          onCellEdit?.(editingCell.row, editingCell.col, processedValue)
        }

        // 좌우 셀 이동
        let newColIndex = columns.findIndex(c => c.key === editingCell.col)

        if (e.key === 'ArrowLeft') {
          newColIndex = Math.max(0, newColIndex - 1)
        } else if (e.key === 'ArrowRight') {
          newColIndex = Math.min(columns.length - 1, newColIndex + 1)
        }

        setEditingCell(null)
        setIsKeyboardEdit(false)
        setSelectedCell({ row: editingCell.row, col: columns[newColIndex].key })
      } else {
        // 일반 텍스트/숫자 입력: 커서가 끝에 있을 때만 셀 이동
        if (!editingCell) return

        const input = inputRef.current as HTMLInputElement
        if (!input) return

        const cursorPos = input.selectionStart ?? 0
        const textLength = editValue.length

        let shouldMoveCell = false

        if (e.key === 'ArrowLeft' && cursorPos === 0) {
          // 커서가 맨 앞에 있을 때 왼쪽 방향키
          shouldMoveCell = true
        } else if (e.key === 'ArrowRight' && cursorPos === textLength) {
          // 커서가 맨 뒤에 있을 때 오른쪽 방향키
          shouldMoveCell = true
        }

        if (shouldMoveCell) {
          e.preventDefault()
          e.stopPropagation()

          // 현재 편집 내용 커밋
          const newData = [...gridData]
          const column = columns.find(col => col.key === editingCell.col)

          let processedValue: any = editValue
          if (column?.type === 'number') {
            processedValue = editValue === '' ? null : Number(editValue)
          }

          const oldValue = newData[editingCell.row][editingCell.col]

          if (oldValue !== processedValue) {
            newData[editingCell.row] = {
              ...newData[editingCell.row],
              [editingCell.col]: processedValue
            }

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

            // 내부 업데이트 플래그 먼저 설정
            isInternalUpdate.current = true

            setModifiedCells(newModifiedCells)
            setGridData(newData)
            addToHistory(newData)

            onDataChange?.(newData)
            onCellEdit?.(editingCell.row, editingCell.col, processedValue)
          }

          // 좌우 셀 이동
          let newColIndex = columns.findIndex(c => c.key === editingCell.col)

          if (e.key === 'ArrowLeft') {
            newColIndex = Math.max(0, newColIndex - 1)
          } else if (e.key === 'ArrowRight') {
            newColIndex = Math.min(columns.length - 1, newColIndex + 1)
          }

          setEditingCell(null)
          setIsKeyboardEdit(false)
          setSelectedCell({ row: editingCell.row, col: columns[newColIndex].key })
        }
        // 커서가 중간에 있으면 기본 동작(커서 이동) 허용
      }
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

  // 한글 자모 필터링 함수 (완성된 글자만 추출)
  const filterCompleteKoreanChars = (text: string): string => {
    return text.split('').filter(char => {
      const code = char.charCodeAt(0)
      // 완성된 한글 음절 범위 (가-힣)
      const isCompleteKorean = code >= 0xAC00 && code <= 0xD7A3
      // 한글 자모 범위 (ㄱ-ㅎ, ㅏ-ㅣ)
      const isJamo = (code >= 0x3131 && code <= 0x314E) || (code >= 0x314F && code <= 0x3163)

      // 완성된 한글이거나 한글이 아닌 문자(영어, 숫자 등)는 포함
      return isCompleteKorean || !isJamo
    }).join('')
  }

  // 전역 검색 필터링 (메모이제이션)
  const filteredData = useMemo(() => {
    if (!globalSearchTerm) return gridData

    // 완성된 글자만 추출하여 검색
    const cleanedSearchTerm = filterCompleteKoreanChars(globalSearchTerm)
    const searchLower = cleanedSearchTerm.toLowerCase()

    return gridData.filter(row => {
      // 검색어와 매칭되는 셀이 있으면 표시
      return columns.some(col => {
        const cellValue = row[col.key]
        return String(cellValue ?? '').toLowerCase().includes(searchLower)
      })
    })
  }, [gridData, globalSearchTerm, columns])

  const exportToExcel = () => {
    // ID 컬럼이 있는지 확인
    const hasIdInColumns = columns.some(col => col.key === 'id')
    const hasIdInData = gridData.length > 0 && 'id' in gridData[0]

    // ID를 포함할지 결정 (데이터에는 있지만 columns에는 없는 경우 자동 추가)
    const exportColumns = hasIdInData && !hasIdInColumns
      ? [{ key: 'id', title: 'ID' }, ...columns]
      : columns

    // 헤더와 데이터 준비
    const headers = exportColumns.map(col => col.title)
    const data = gridData.map(row =>
      exportColumns.map(col => row[col.key] ?? '')
    )

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

    // 컬럼 너비 자동 조정
    const colWidths = exportColumns.map(col => ({
      wch: Math.max(col.title.length * 2, 10)
    }))
    ws['!cols'] = colWidths

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    // 파일 다운로드
    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${exportFilePrefix}_${dateStr}.xlsx`)
  }

  const importFromExcel = async (file: File, mode: 'replace' | 'merge' = 'replace') => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary', WTF: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (jsonData.length < 2) {
        alert('데이터가 없습니다.')
        return
      }

      // 첫 번째 행을 헤더로 사용
      const excelHeaders = jsonData[0] as string[]

      // 헤더 이름으로 컬럼 매칭 (순서 무관)
      const columnMap = new Map<number, Column<T>>()
      excelHeaders.forEach((header, excelIdx) => {
        const matchedColumn = columns.find(col => col.title === header)
        if (matchedColumn) {
          columnMap.set(excelIdx, matchedColumn)
        }
      })

      // 매칭되지 않은 필수 컬럼이 있는지 확인
      const unmatchedColumns = columns
        .filter(col => !Array.from(columnMap.values()).some(c => c.key === col.key))
        .map(col => col.title)

      if (unmatchedColumns.length > 0) {
        const proceed = confirm(
          `다음 컬럼이 엑셀에 없습니다:\n${unmatchedColumns.join(', ')}\n\n계속 진행하시겠습니까?`
        )
        if (!proceed) return
      }

      // 데이터 파싱 및 검증
      const errors: string[] = []
      const imported = jsonData.slice(1).map((row, rowIdx) => {
        const rowData: any = {}

        // 헤더로 매칭된 컬럼만 처리
        columnMap.forEach((column, excelIdx) => {
          const value = row[excelIdx]

          if (column.type === 'number') {
            const numValue = Number(value)
            if (value !== '' && value !== null && value !== undefined && isNaN(numValue)) {
              errors.push(`행 ${rowIdx + 2}, ${column.title}: 숫자가 아닙니다 (값: ${value})`)
              rowData[column.key] = null
            } else {
              rowData[column.key] = value === '' || value === null || value === undefined ? null : numValue
            }
          } else if (column.type === 'checkbox') {
            rowData[column.key] = value === true || value === 'true' || value === '1' || value === 1
          } else {
            rowData[column.key] = value ?? ''
          }
        })

        // 매칭되지 않은 컬럼은 기본값 설정
        columns.forEach(col => {
          if (!(col.key in rowData)) {
            if (col.type === 'number') {
              rowData[col.key] = null
            } else if (col.type === 'checkbox') {
              rowData[col.key] = false
            } else {
              rowData[col.key] = ''
            }
          }
        })

        return rowData as T
      })

      // 검증 오류가 있으면 경고
      if (errors.length > 0) {
        const showErrors = errors.slice(0, 10).join('\n')
        const moreErrors = errors.length > 10 ? `\n\n... 외 ${errors.length - 10}개 오류` : ''
        const proceed = confirm(
          `데이터 검증 오류가 발견되었습니다:\n\n${showErrors}${moreErrors}\n\n계속 진행하시겠습니까?`
        )
        if (!proceed) return
      }

      // tableName이 있으면 DB 저장까지 처리 (모달에서 바로 저장)
      if (tableName) {
        try {
          const supabase = createClient()

          // 1단계: 데이터 유효성 검사 및 중복 제거
          const seen = new Map<string, T>()
          const uniqueRows: T[] = []

          imported.forEach(row => {
            // excludeEmptyColumns 체크
            if (excludeEmptyColumns && excludeEmptyColumns.length > 0) {
              const allEmpty = excludeEmptyColumns.every(col => !row[col])
              if (allEmpty) return // 모든 필수 컬럼이 비어있으면 스킵
            }

            // validateRow 체크
            if (validateRow && !validateRow(row)) {
              return // 유효성 검사 실패 시 스킵
            }

            // mergeKeyGetter로 중복 체크
            const key = mergeKeyGetter ? mergeKeyGetter(row) : JSON.stringify(row)
            if (!seen.has(key)) {
              seen.set(key, row)
              uniqueRows.push(row)
            }
          })

          if (uniqueRows.length < imported.length) {
            const duplicateCount = imported.length - uniqueRows.length
            alert(`엑셀 파일에서 ${duplicateCount}개의 중복이 발견되어 제거했습니다.`)
          }

          if (mode === 'replace') {
            // 전체 교체 모드: 기존 데이터 모두 삭제 후 새로 삽입
            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

            if (deleteError) {
              alert(`기존 데이터 삭제 실패: ${deleteError.message}`)
              return
            }

            // 중복 체크 후 새 데이터 삽입
            const insertedKeys = new Set<string>()

            for (let i = 0; i < uniqueRows.length; i++) {
              const row = uniqueRows[i]
              const key = mergeKeyGetter ? mergeKeyGetter(row) : JSON.stringify(row)

              if (insertedKeys.has(key)) {
                console.log('저장 중 중복 스킵:', row)
                continue
              }

              // id 제거 (DB에서 자동 생성)
              const { id, ...rowWithoutId } = row as any

              // transformBeforeSave가 있으면 데이터 변환 (예: 이름→ID 변환)
              const transformedRow = transformBeforeSave ? transformBeforeSave(rowWithoutId as T) : rowWithoutId

              const { error } = await supabase.from(tableName).insert([transformedRow])

              if (error) {
                alert(`데이터 등록 실패: ${error.message}`)
                return
              }

              insertedKeys.add(key)
            }

            alert('전체 교체가 완료되었습니다.')
          } else {
            // 병합 모드: 기존 데이터와 병합
            const insertedKeys = new Set<string>()

            for (let i = 0; i < uniqueRows.length; i++) {
              const row = uniqueRows[i]
              const key = mergeKeyGetter ? mergeKeyGetter(row) : JSON.stringify(row)

              // 이번 저장에서 이미 삽입했는지 체크
              if (insertedKeys.has(key)) {
                console.log('저장 중 중복 스킵:', row)
                continue
              }

              // mergeKeyGetter가 있으면 해당 키로 DB 중복 체크
              if (mergeKeyGetter) {
                // 키를 파싱해서 각 필드로 쿼리 생성
                // 예: "사입|대분류|중분류|||" -> {expense_type: '사입', category_1: '대분류', ...}
                const keyParts = key.split('|')
                let query = supabase.from(tableName).select('id')

                // 컬럼 순서대로 필터 적용 (mergeKeyGetter와 동일한 순서)
                const keyColumns = Object.keys(row).filter(k => k !== 'id' && k !== 'notes' && k !== 'is_active' && k !== 'created_at' && k !== 'updated_at')
                keyColumns.forEach((col: string, idx) => {
                  if (idx < keyParts.length) {
                    query = query.eq(col, keyParts[idx] || null)
                  }
                })

                const { data: existing } = await query.limit(1)

                if (existing && existing.length > 0) {
                  console.log('DB 중복 스킵:', row)
                  continue
                }
              }

              // id 제거 (DB에서 자동 생성)
              const { id, ...rowWithoutId } = row as any

              // transformBeforeSave가 있으면 데이터 변환 (예: 이름→ID 변환)
              const transformedRow = transformBeforeSave ? transformBeforeSave(rowWithoutId as T) : rowWithoutId

              const { error } = await supabase.from(tableName).insert([transformedRow])

              if (error) {
                alert(`데이터 등록 실패: ${error.message}`)
                return
              }

              insertedKeys.add(key)
            }

            alert('병합이 완료되었습니다.')
          }

          // 완료 후 콜백 실행 (데이터 재조회 등)
          if (onDataReload) {
            await onDataReload()
          }

          // 저장 완료 후 상태 초기화 (저장 버튼 비활성화)
          setAddedRows(new Set())
          setModifiedCells(new Set())
          setCopiedRows(new Set())
        } catch (error) {
          console.error('엑셀 업로드 저장 실패:', error)
          alert('엑셀 업로드 중 오류가 발생했습니다.')
        }
        return
      }

      // excelImportConfig가 없으면 기존 방식 (테이블에 표시만)
      if (mode === 'replace') {
        // 전체 교체 모드
        // 모든 행을 추가된 행으로 표시
        const newAddedRows = new Set<number>()
        imported.forEach((_, idx) => {
          newAddedRows.add(idx)
        })
        setAddedRows(newAddedRows)

        // 히스토리에 추가
        addToHistory(imported)

        setGridData(imported)
        onDataChange?.(imported)
      } else {
        // 병합 모드 (ID 기반 또는 커스텀 키 기반 + 신규 추가)
        const existingDataMap = new Map<string, T>()

        // mergeKeyGetter가 제공되면 커스텀 키로, 없으면 ID로 맵핑
        gridData.forEach(row => {
          if (mergeKeyGetter) {
            // 커스텀 키로 중복 체크 (예: 카테고리 조합)
            const key = mergeKeyGetter(row)
            existingDataMap.set(key, row)
          } else {
            // ID로 중복 체크 (기존 방식)
            const id = (row as any).id
            if (id && !String(id).startsWith('temp_')) {
              existingDataMap.set(String(id), row)
            }
          }
        })

        // 업데이트 및 새로 추가할 항목 분류
        const updatedItems: T[] = []
        const newItems: T[] = []
        let skippedCount = 0
        const processedKeys = new Set<string>() // 이번 업로드에서 이미 처리한 키 추적

        imported.forEach(importedRow => {
          let key: string

          if (mergeKeyGetter) {
            // 커스텀 키로 중복 체크
            key = mergeKeyGetter(importedRow)
          } else {
            // ID로 중복 체크
            const id = (importedRow as any).id
            key = id && !String(id).startsWith('temp_') ? String(id) : ''
          }

          if (key && existingDataMap.has(key)) {
            // 기존 데이터에 존재하면 업데이트 (중복 체크)
            if (processedKeys.has(key)) {
              // 이미 처리한 키면 스킵
              skippedCount++
            } else {
              const existing = existingDataMap.get(key)!
              updatedItems.push({ ...existing, ...importedRow })
              existingDataMap.delete(key)
              processedKeys.add(key)
            }
          } else if (mergeKeyGetter && key) {
            // 커스텀 키가 있지만 기존 데이터에 없으면 중복 체크 후 추가
            if (processedKeys.has(key)) {
              // 이미 처리한 키면 스킵
              skippedCount++
            } else {
              // 신규 추가 (temp_ ID 부여)
              const newRow = { ...importedRow, id: `temp_${Date.now()}_${Math.random()}` }
              newItems.push(newRow as T)
              processedKeys.add(key)
            }
          } else if (!mergeKeyGetter && !key) {
            // ID가 없으면 신규 추가 (기존 방식)
            const newRow = { ...importedRow, id: `temp_${Date.now()}_${Math.random()}` }
            newItems.push(newRow as T)
          }
        })

        // 업데이트되지 않은 기존 항목들
        const unchangedItems = Array.from(existingDataMap.values())

        // 최종 데이터 = 기존(유지) + 업데이트 + 신규
        const mergedData = [...unchangedItems, ...updatedItems, ...newItems]

        // 신규 추가된 항목들의 인덱스를 addedRows에 추가
        const newAddedRows = new Set(addedRows)
        newItems.forEach((_, idx) => {
          const rowIndex = unchangedItems.length + updatedItems.length + idx
          newAddedRows.add(rowIndex)
        })
        setAddedRows(newAddedRows)

        // 업데이트된 항목들을 modifiedCells에 추가
        const newModifiedCells = new Set(modifiedCells)
        updatedItems.forEach((_, idx) => {
          const rowIndex = unchangedItems.length + idx
          // 모든 컬럼을 수정된 것으로 표시
          columns.forEach(column => {
            const cellKey = `${rowIndex}-${column.key}`
            newModifiedCells.add(cellKey)
          })
        })
        setModifiedCells(newModifiedCells)

        // 히스토리에 추가
        addToHistory(mergedData)

        setGridData(mergedData)
        onDataChange?.(mergedData)

        const message = skippedCount > 0
          ? `병합 완료:\n업데이트: ${updatedItems.length}건\n신규 추가: ${newItems.length}건\n유지: ${unchangedItems.length}건\n중복 스킵: ${skippedCount}건`
          : `병합 완료:\n업데이트: ${updatedItems.length}건\n신규 추가: ${newItems.length}건\n유지: ${unchangedItems.length}건`
        alert(message)
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportModeSelect = (mode: 'replace' | 'merge') => {
    if (pendingImportFile) {
      importFromExcel(pendingImportFile, mode)
      setPendingImportFile(null)
      setShowImportModeDialog(false)
    }
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
    if (!columnKey) return false
    const column = columns.find(c => c.key === columnKey)
    if (column?.type === 'number') return true
    // 금액 관련 필드명으로도 판단
    const numberKeywords = ['price', 'cost', 'fee', 'amount', 'commission', 'rate', 'quantity', 'weight']
    return numberKeywords.some(keyword => columnKey.toLowerCase().includes(keyword))
  }


  const getCellClassName = useCallback((rowIndex: number, columnKey: string, column: Column<T>, row: T, isSticky: boolean = false) => {
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === columnKey
    const rowId = getRowId(row)
    const isRowSelected = selectedRowIds.has(rowId)
    const cellKey = `${rowIndex}-${columnKey}`
    const isMultiSelected = selectedCells.has(cellKey) // 다중 셀 선택 여부
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

    // 선택된 셀 (단일 선택이 우선순위 높음)
    if (isSelected) {
      classes += 'ring-2 ring-blue-500 ring-inset z-20 bg-blue-100 '
    }
    // 다중 셀 선택
    else if (isMultiSelected) {
      classes += 'ring-1 ring-blue-400 ring-inset z-10 bg-blue-50 '
    }
    // 채우기 범위
    else if (isFillRange) {
      classes += 'bg-red-50 ring-1 ring-red-400 ring-inset '
    }
    // 체크박스로 선택된 행
    else if (isRowSelected) {
      classes += 'bg-blue-50 '
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
    if (isReadOnly(column, row)) {
      classes += 'bg-gray-50 '
    } else {
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
  }, [selectedCell, selectedCells, modifiedCells, addedRows, copiedRows, hoverCell, fillStartCell, fillPreviewData, selectedRowIds, getRowId])

  const renderCell = (row: T, column: Column<T>, rowIndex: number) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.key
    // 미리보기 데이터가 있으면 사용, 없으면 원본 데이터 사용
    const displayRow = fillPreviewData ? fillPreviewData[rowIndex] : row
    const value = displayRow[column.key]
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === column.key
    const isNumberCol = isNumberColumn(column.key)
    const displayValue = isNumberColumn(column.key) ? formatNumberWithComma(value) : (value ?? '')

    // 선택된 셀 또는 편집 중인 셀에 input 렌더링 (한글 입력 지원)
    const shouldShowInput = (isSelected || isEditing) && !isReadOnly(column, row) &&
                            column.type !== 'checkbox' && column.type !== 'dropdown'

    if (isEditing && column.type === 'dropdown' && column.source) {
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
          {column.source.map((option, idx) => (
            <option key={`${option}-${idx}`} value={option}>{option}</option>
          ))}
        </select>
      )
    }

    if (isEditing && column.type === 'checkbox') {
      return (
        <div className="flex items-center justify-center h-full">
          <input
            type="checkbox"
            checked={!!editValue && editValue !== 'false'}
            readOnly
            className="w-4 h-4"
          />
        </div>
      )
    }

    // 일반 텍스트/숫자 입력 (선택 또는 편집 모드)
    if (shouldShowInput) {
      return (
        <>
          {!isEditing && <span style={{ fontSize: '13px', position: 'relative', zIndex: 1, pointerEvents: 'none' }}>{displayValue}</span>}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={isEditing ? editValue : ''}
            onChange={(e) => {
              if (isEditing) {
                setEditValue(e.target.value)
              }
            }}
            onBlur={() => {
              if (isEditing) {
                commitEdit()
              }
            }}
            onKeyDown={(e) => {
              if (isEditing) {
                handleKeyDown(e)
              } else {
                // 선택 모드에서의 키 처리
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  e.stopPropagation() // 전역 핸들러로 전달 방지

                  // 직접 셀 이동 처리
                  let newRow = rowIndex
                  let newColIndex = columns.findIndex(c => c.key === column.key)

                  if (e.key === 'ArrowUp') {
                    newRow = Math.max(0, rowIndex - 1)
                  } else if (e.key === 'ArrowDown') {
                    newRow = Math.min(gridData.length - 1, rowIndex + 1)
                  } else if (e.key === 'ArrowLeft') {
                    newColIndex = Math.max(0, newColIndex - 1)
                  } else if (e.key === 'ArrowRight') {
                    newColIndex = Math.min(columns.length - 1, newColIndex + 1)
                  }

                  setSelectedCell({ row: newRow, col: columns[newColIndex].key })
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsKeyboardEdit(false)
                  setEditingCell({ row: rowIndex, col: column.key })
                  setEditValue(value ?? '')
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault()
                  e.stopPropagation()

                  // 값을 바로 삭제 (편집 모드로 전환하지 않음)
                  const newData = [...gridData]
                  newData[rowIndex] = {
                    ...newData[rowIndex],
                    [column.key]: column.type === 'number' ? null : ''
                  }

                  // 수정 추적
                  const cellKey = `${rowIndex}-${column.key}`
                  const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)
                  const newModifiedCells = new Set(modifiedCells)

                  if (!isAddedOrCopied) {
                    const originalValue = originalDataRef.current[rowIndex]?.[column.key]
                    const newValue = column.type === 'number' ? null : ''

                    // 원본 값이 존재하고(빈 값이 아니고) 삭제한 경우 무조건 수정으로 추적
                    const originalHasValue = originalValue !== null && originalValue !== undefined && originalValue !== ''

                    if (newValue === originalValue) {
                      newModifiedCells.delete(cellKey)
                    } else if (originalHasValue) {
                      // 원본에 값이 있었는데 삭제한 경우 반드시 추가
                      newModifiedCells.add(cellKey)
                    } else if (newValue !== originalValue) {
                      // 그 외 다른 경우도 추가
                      newModifiedCells.add(cellKey)
                    }
                  }

                  // 내부 업데이트 플래그 먼저 설정
                  isInternalUpdate.current = true

                  // React 18의 자동 배칭을 활용하여 상태 업데이트
                  setModifiedCells(newModifiedCells)
                  setGridData(newData)
                  addToHistory(newData)

                  // 다음 틱에 콜백 실행 (상태 업데이트 완료 후)
                  setTimeout(() => {
                    onDataChange?.(newData)
                  }, 0)
                }
              }
            }}
            onCompositionStart={() => {
              // IME 조합 시작 - 편집 모드로 전환
              if (!isEditing) {
                setIsKeyboardEdit(true)
                setEditingCell({ row: rowIndex, col: column.key })
                setEditValue('')
              }
            }}
            onCompositionUpdate={(e) => {
              // IME 조합 중 - 값 업데이트
              e.stopPropagation()
              if (isEditing) {
                setEditValue((e.target as HTMLInputElement).value)
              }
            }}
            onCompositionEnd={(e) => {
              // IME 조합 완료
              e.stopPropagation()
              const inputValue = (e.target as HTMLInputElement).value
              if (isEditing) {
                setEditValue(inputValue)
              } else if (inputValue) {
                // 선택 모드에서 조합 완료 시 편집 모드로 전환
                setIsKeyboardEdit(true)
                setEditingCell({ row: rowIndex, col: column.key })
                setEditValue(inputValue)
              }
            }}
            onInput={(e) => {
              // 조합 중이 아닌 경우 (영어, 숫자 등)
              const nativeEvent = e.nativeEvent as InputEvent
              if (!nativeEvent.isComposing && !isEditing) {
                const inputValue = (e.target as HTMLInputElement).value
                if (inputValue) {
                  setIsKeyboardEdit(true)
                  setEditingCell({ row: rowIndex, col: column.key })
                  setEditValue(inputValue)
                }
              }
            }}
            className={`absolute inset-0 w-full h-full px-2 py-1 border-none outline-none resize-none overflow-hidden ${
              isEditing ? 'bg-transparent' : 'bg-transparent text-transparent caret-transparent'
            } ${isNumberCol ? 'text-right' : 'text-center'}`}
            style={{
              fontSize: '13px',
              margin: 0,
              lineHeight: 'normal',
              zIndex: isEditing ? 1 : 2
            }}
            autoFocus
          />
        </>
      )
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
        <div className="flex items-center justify-center h-full cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            readOnly
            className="w-4 h-4 pointer-events-none"
          />
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

    // 객체인 경우 안전하게 처리
    const safeDisplayValue = typeof displayValue === 'object' && displayValue !== null
      ? JSON.stringify(displayValue)
      : displayValue

    return (
      <>
        <span style={{ fontSize: '13px' }}>{safeDisplayValue}</span>
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
    let newSelected: Set<string>
    if (selectedRowIds.size === filteredData.length) {
      newSelected = new Set()
    } else {
      newSelected = new Set(filteredData.map(row => getRowId(row)))
    }
    setSelectedRowIds(newSelected)
    // 부모에게 선택 변경 알림 (인덱스로 변환)
    const indices = filteredData
      .map((row, idx) => (newSelected.has(getRowId(row)) ? idx : -1))
      .filter(idx => idx !== -1)
    onSelectionChange?.(indices)
  }

  const handleToggleRow = (row: T) => {
    const rowId = getRowId(row)
    const newSelected = new Set(selectedRowIds)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    setSelectedRowIds(newSelected)
    // 부모에게 선택 변경 알림 (인덱스로 변환)
    const indices = filteredData
      .map((r, idx) => (newSelected.has(getRowId(r)) ? idx : -1))
      .filter(idx => idx !== -1)
    onSelectionChange?.(indices)
  }

  const handleSaveClick = () => {
    if (onSave) {
      // 수정된 행만 추출
      const modifiedRowIndices = new Set<number>()
      modifiedCells.forEach(cellKey => {
        const rowIndex = parseInt(cellKey.split('-')[0])
        modifiedRowIndices.add(rowIndex)
      })

      const modifiedRows = Array.from(modifiedRowIndices).map(index => gridData[index])

      // 수정된 행이 있으면 전달, 없으면 undefined
      onSave(modifiedRows.length > 0 ? modifiedRows : undefined)

      // 저장 후 상태 초기화 (수정 카운트 리셋)
      setModifiedCells(new Set())
      setAddedRows(new Set())
      setCopiedRows(new Set())

      // 원본 데이터를 현재 데이터로 업데이트 (저장된 상태가 새로운 기준점)
      originalDataRef.current = JSON.parse(JSON.stringify(gridData))
    }
  }

  const handleDeleteSelectedClick = () => {
    // 선택된 ID를 인덱스로 변환
    const selectedIndices = gridData
      .map((row, idx) => (selectedRowIds.has(getRowId(row)) ? idx : -1))
      .filter(idx => idx !== -1)

    if (onDeleteSelected) {
      // 커스텀 삭제 핸들러가 있으면 사용
      onDeleteSelected(selectedIndices)
    } else {
      // 기본 삭제 동작: 선택된 행을 데이터에서 제거
      const newData = gridData.filter((row) => !selectedRowIds.has(getRowId(row)))

      setGridData(newData)
      addToHistory(newData)
      onDataChange?.(newData)
      setSelectedRowIds(new Set())

      // 삭제된 행 인덱스를 추적 상태에서도 제거
      setModifiedCells(new Set())
      setAddedRows(new Set())
      setCopiedRows(new Set())
    }
  }

  const handleCopyClick = () => {
    // 선택된 행들을 복사해서 바로 아래에 추가
    const selectedRows = gridData.filter(row => selectedRowIds.has(getRowId(row)))
    const copiedRowsList: T[] = []

    selectedRows.forEach(originalRow => {
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
    setSelectedRowIds(new Set())

    // 콜백이 있으면 호출 (추가 로직용) - 인덱스로 변환
    if (onCopy) {
      const indices = gridData
        .map((row, idx) => (selectedRowIds.has(getRowId(row)) ? idx : -1))
        .filter(idx => idx !== -1)
      onCopy(indices)
    }
  }

  return (
    <div>
      {(enableFilter || enableCSVExport || enableCSVImport || onSave || onDeleteSelected || enableCopy || customActions) && (
        <div className="flex gap-2 items-center mb-2">
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
              onClick={exportToExcel}
              className="p-1 border border-gray-200 rounded hover:bg-surface-hover"
              title="엑셀 다운로드"
            >
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M9.5 13.5L12 16l2.5-2.5M12 10v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {enableCSVImport && (
            <label className="cursor-pointer p-1 border border-gray-200 rounded hover:bg-gray-50" title="엑셀 업로드">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPendingImportFile(e.target.files[0])
                    setShowImportModeDialog(true)
                    e.target.value = '' // 같은 파일 재선택 가능하도록
                  }
                }}
                className="hidden"
              />
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M12 10v6m-2.5-3.5L12 10l2.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </label>
          )}
          {customActions}
          <div className="flex-1"></div>
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
              disabled={!forceModified && modifiedCount === 0 && addedRows.size === 0 && copiedRows.size === 0}
              className={`px-2 py-1 rounded text-xs ${
                forceModified || modifiedCount > 0 || addedRows.size > 0 || copiedRows.size > 0
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          )}
          {selectedRowIds.size > 0 && enableDelete && (
            <button
              onClick={handleDeleteSelectedClick}
              className="px-2 py-1 bg-danger text-white rounded text-xs hover:bg-danger-hover"
            >
              삭제 ({selectedRowIds.size})
            </button>
          )}
          {selectedRowIds.size > 0 && enableCopy && (
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
        className="overflow-x-auto overflow-y-auto bg-surface border-b border-gray-200"
        style={{ maxHeight: height }}
        onPaste={handlePaste}
        onScroll={onScroll}
        tabIndex={0}
      >
        <table ref={tableRef} className="border-collapse" style={{ fontSize: '13px', borderSpacing: 0, tableLayout: 'auto', minWidth: '100%' }}>
          <thead className="sticky top-0 bg-gray-50" style={{ zIndex: 30, boxShadow: 'inset 0 1px 0 0 #e5e7eb' }}>
            <tr key="header-row">
              {enableCheckbox && (
                <th key="checkbox-header" className="border border-gray-200 bg-gray-50 px-2 py-1 text-center align-middle sticky top-0" style={{ width: 40, fontSize: '13px', zIndex: 31 }}>
                  <input
                    type="checkbox"
                    checked={selectedRowIds.size === filteredData.length && filteredData.length > 0}
                    onChange={handleToggleAll}
                    className="cursor-pointer align-middle"
                  />
                </th>
              )}
              {showRowNumbers && (
                <th key="row-number-header" className="border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-text-secondary whitespace-nowrap sticky top-0" style={{ width: 50, fontSize: '13px', zIndex: 31 }}>
                  {enableAddRow ? (
                    <button
                      onClick={handleAddRow}
                      className="text-primary hover:text-blue-800 dark:hover:text-blue-300 font-normal"
                      style={{ fontSize: '13px' }}
                      title="행 추가"
                    >
                      +행추가
                    </button>
                  ) : (
                    '#'
                  )}
                </th>
              )}
              {columns.map((column, colIdx) => {
                return (
                  <th
                    key={column.key || `col-${colIdx}`}
                    className="border border-gray-200 px-2 py-1 font-semibold text-text whitespace-nowrap bg-gray-50 sticky top-0"
                    style={{
                      width: columnWidths[column.key] || column.width || 100,
                      fontSize: '13px',
                      zIndex: 31,
                      position: 'relative'
                    }}
                  >
                    <div
                      className={`flex items-center justify-center gap-1 ${enableSort && column.type !== 'checkbox' ? 'cursor-pointer hover:text-primary' : ''}`}
                      onClick={() => column.type !== 'checkbox' && handleSort(column.key)}
                    >
                      <span>{column.title}</span>
                      {column.type === 'checkbox' && (
                        <input
                          type="checkbox"
                          checked={filteredData.every(row => row[column.key] === true)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                            const newData = [...gridData]
                            const newModifiedCells = new Set(modifiedCells)

                            filteredData.forEach((row, idx) => {
                              const rowIndex = gridData.findIndex(r => r === row)
                              if (rowIndex !== -1) {
                                newData[rowIndex] = {
                                  ...newData[rowIndex],
                                  [column.key]: newValue
                                }

                                const cellKey = `${rowIndex}-${column.key}`
                                const isAddedOrCopied = addedRows.has(rowIndex) || copiedRows.has(rowIndex)

                                if (!isAddedOrCopied) {
                                  const originalValue = originalDataRef.current[rowIndex]?.[column.key]
                                  if (newValue === originalValue) {
                                    newModifiedCells.delete(cellKey)
                                  } else {
                                    newModifiedCells.add(cellKey)
                                  }
                                }
                              }
                            })

                            setGridData(newData)
                            setModifiedCells(newModifiedCells)

                            requestAnimationFrame(() => {
                              addToHistory(newData)
                              if (onDataChange) {
                                isInternalUpdate.current = true
                                onDataChange(newData)
                              }
                            })
                          }}
                          className="w-4 h-4 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {enableSort && column.type !== 'checkbox' && sortConfig.key === column.key && (
                        <span className="text-primary">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    {/* 리사이징 핸들 */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, column.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        backgroundColor: resizingColumn === column.key ? '#2563eb' : 'transparent',
                        zIndex: 32
                      }}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) {
                          e.currentTarget.style.backgroundColor = '#d1d5db'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    />
                  </th>
                )
              })}
              {enableDelete && (
                <th
                  key="delete-header"
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
              <tr
                key={rowIndex}
                style={{
                  contentVisibility: 'auto',
                  contain: 'layout style paint',
                }}
              >
                {enableCheckbox && (
                  <td key="checkbox" className="border border-gray-200 px-2 py-1 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.has(getRowId(row))}
                      onChange={() => handleToggleRow(row)}
                      className="cursor-pointer align-middle"
                    />
                  </td>
                )}
                {showRowNumbers && (
                  <td key="row-number" className="border border-gray-200 px-2 py-1 text-xs text-center align-middle text-text-tertiary">
                    {startIndex + rowIndex + 1}
                  </td>
                )}
                {columns.map((column, colIdx) => {
                  const cellValue = row[column.key];
                  const customStyle = column.cellStyle ? column.cellStyle(cellValue, row, rowIndex) : {};

                  const width = columnWidths[column.key] || column.width || 100
                  return (
                    <td
                      key={column.key || `col-${colIdx}`}
                      className={getCellClassName(rowIndex, column.key, column, row, false)}
                      style={{
                        height: rowHeight,
                        width: width,
                        minWidth: width,
                        maxWidth: width,
                        userSelect: isDragging ? 'none' : 'text',
                        ...customStyle
                      }}
                      onMouseDown={(e) => handleCellMouseDown(rowIndex, column.key, e)}
                      onClick={(e) => handleCellClick(rowIndex, column.key, row[column.key], e)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, column.key, row[column.key])}
                      onMouseEnter={() => {
                        if (isDragging) {
                          handleCellMouseEnter(rowIndex, column.key)
                        } else {
                          setHoverCell({ row: rowIndex, col: column.key })
                        }
                      }}
                      onMouseLeave={() => !fillStartCell && !isDragging && setHoverCell(null)}
                    >
                      {renderCell(row, column, rowIndex)}
                    </td>
                  )
                })}
                {enableDelete && (
                  <td key="delete-btn" className="border border-gray-200 px-2 py-1 text-center align-middle" style={{ height: rowHeight, width: 100 }}>
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

      {/* 엑셀 업로드 모드 선택 다이얼로그 */}
      {showImportModeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">엑셀 업로드 방식 선택</h3>
            <p className="text-sm text-gray-600 mb-6">
              엑셀 파일을 어떻게 적용하시겠습니까?
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleImportModeSelect('replace')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">전체 교체</div>
                <div className="text-sm text-gray-600 mt-1">
                  현재 데이터를 모두 삭제하고 엑셀 파일로 교체합니다
                </div>
              </button>

              <button
                onClick={() => handleImportModeSelect('merge')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">병합 (ID 기반)</div>
                <div className="text-sm text-gray-600 mt-1">
                  ID가 일치하는 항목은 업데이트하고, 새로운 항목은 추가합니다
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowImportModeDialog(false)
                setPendingImportFile(null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
