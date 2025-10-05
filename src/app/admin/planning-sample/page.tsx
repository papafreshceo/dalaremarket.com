'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/ui'

interface Task {
  id: string
  name: string
  start: string
  end: string
  progress: number
  color: string
  parent?: string
  expanded?: boolean
  assignee?: string
}

export default function PlanningSamplePage() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: '거래처 관리 프로젝트',
      start: '2025-10-01',
      end: '2025-10-15',
      progress: 60,
      color: '#3b82f6',
      expanded: true
    },
    {
      id: '2',
      name: '신규 거래처 발굴',
      start: '2025-10-01',
      end: '2025-10-08',
      progress: 80,
      color: '#10b981',
      parent: '1'
    },
    {
      id: '3',
      name: '계약서 작성',
      start: '2025-10-09',
      end: '2025-10-12',
      progress: 40,
      color: '#f59e0b',
      parent: '1'
    },
    {
      id: '4',
      name: '재고 관리 시스템',
      start: '2025-10-05',
      end: '2025-10-20',
      progress: 30,
      color: '#8b5cf6',
      expanded: true
    },
    {
      id: '5',
      name: '시세 분석',
      start: '2025-10-10',
      end: '2025-10-18',
      progress: 50,
      color: '#ec4899',
      parent: '4'
    },
    {
      id: '6',
      name: '데이터 수집',
      start: '2025-10-10',
      end: '2025-10-13',
      progress: 70,
      color: '#06b6d4',
      parent: '4'
    }
  ])

  const [showAddTask, setShowAddTask] = useState(false)
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskStart, setNewTaskStart] = useState<Date | null>(null)
  const [newTaskEnd, setNewTaskEnd] = useState<Date | null>(null)
  const [newTaskProgress, setNewTaskProgress] = useState(0)
  const [newTaskAssignee, setNewTaskAssignee] = useState('')

  const toggleExpanded = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, expanded: !task.expanded } : task
    ))
  }

  const formatDateToString = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const addParentTask = () => {
    if (!newTaskName || !newTaskStart || !newTaskEnd) return

    // 시작일이 종료일보다 늦으면 리턴
    if (newTaskStart > newTaskEnd) return

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      start: formatDateToString(newTaskStart),
      end: formatDateToString(newTaskEnd),
      progress: newTaskProgress,
      color: randomColor,
      expanded: true,
      assignee: newTaskAssignee
    }

    setTasks([...tasks, newTask])
    setNewTaskName('')
    setNewTaskStart(null)
    setNewTaskEnd(null)
    setNewTaskProgress(0)
    setNewTaskAssignee('')
    setShowAddTask(false)
  }

  const addChildTask = (parentId: string) => {
    if (!newTaskName || !newTaskStart || !newTaskEnd) return

    // 시작일이 종료일보다 늦으면 리턴
    if (newTaskStart > newTaskEnd) return

    const parent = tasks.find(t => t.id === parentId)
    if (!parent) return

    const startStr = formatDateToString(newTaskStart)
    const endStr = formatDateToString(newTaskEnd)

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      start: startStr,
      end: endStr,
      progress: 0,
      color: parent.color,
      parent: parentId,
      assignee: newTaskAssignee
    }

    // 하위 작업의 종료일이 부모 작업의 종료일보다 크면 부모 작업 종료일 업데이트
    const updatedTasks = tasks.map(task => {
      if (task.id === parentId && new Date(endStr) > new Date(task.end)) {
        return { ...task, end: endStr }
      }
      return task
    })

    setTasks([...updatedTasks, newTask])
    setNewTaskName('')
    setNewTaskStart(null)
    setNewTaskEnd(null)
    setNewTaskAssignee('')
    setAddingChildTo(null)
  }

  const calculatePosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date('2025-10-01')
    const timelineEnd = new Date('2025-10-31')

    const totalDays = Math.floor((timelineEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const daysSinceStart = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      left: `${(daysSinceStart / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    }
  }

  const getDatesForTimeline = () => {
    const dates = []
    const start = new Date('2025-10-01')
    const end = new Date('2025-10-31')

    if (viewMode === 'day') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }
    } else if (viewMode === 'week') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        dates.push(new Date(d))
      }
    } else {
      dates.push(new Date(start))
    }

    return dates
  }

  const getVisibleTasks = () => {
    const visible: Task[] = []

    tasks.forEach(task => {
      if (!task.parent) {
        visible.push(task)
        if (task.expanded) {
          const children = tasks.filter(t => t.parent === task.id)
          visible.push(...children)
        }
      }
    })

    return visible
  }

  const dates = getDatesForTimeline()
  const visibleTasks = getVisibleTasks()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">간트 차트 샘플</h1>
          <button
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 작업 추가
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded ${viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            일간
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            주간
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            월간
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 타임라인 헤더 */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <div className="w-64 px-3 py-2 border-r border-gray-200 font-semibold text-sm text-gray-700">
              작업명
            </div>
            <div className="flex-1 relative">
              <div className="flex h-8">
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 border-r border-gray-200 text-center py-2 text-xs text-gray-600"
                  >
                    {viewMode === 'day' && (
                      date.getDate() === 1
                        ? `${date.getMonth() + 1}/${date.getDate()}`
                        : `${date.getDate()}`
                    )}
                    {viewMode === 'week' && `${date.getMonth() + 1}/${date.getDate()}`}
                    {viewMode === 'month' && `${date.getMonth() + 1}월`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 간트 차트 본문 */}
        <div>
          {visibleTasks.map((task) => {
            const position = calculatePosition(task.start, task.end)
            const isSubTask = !!task.parent
            const hasChildren = tasks.some(t => t.parent === task.id)

            return (
              <div key={task.id}>
                <div className="flex border-b border-gray-200 hover:bg-gray-50">
                  <div className={`w-64 px-3 py-2 border-r border-gray-200 ${isSubTask ? 'pl-8' : ''}`}>
                    <div className="flex items-center gap-2">
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform ${task.expanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{task.name}</div>
                      </div>
                      {!isSubTask && (
                        <button
                          onClick={() => setAddingChildTo(task.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + 하위
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative h-10">
                    {/* 그리드 라인 */}
                    <div className="absolute inset-0 flex">
                      {dates.map((_, idx) => (
                        <div key={idx} className="flex-1 border-r border-gray-100"></div>
                      ))}
                    </div>

                    {/* 태스크 바 */}
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center px-0">
                      <div
                        className="h-6 rounded relative overflow-hidden shadow-sm"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: task.color
                        }}
                      >
                        {/* 진행률 표시 */}
                        <div
                          className="absolute inset-y-0 left-0 bg-black bg-opacity-20"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-[10px] text-white font-medium truncate">
                            {task.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하위 작업 추가 폼 */}
                {addingChildTo === task.id && (
                  <div className="border-b border-gray-200 bg-gray-50 p-4 relative z-20">
                    <div className="max-w-md">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">하위 작업 추가</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="하위 작업명"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">시작일</label>
                            <DatePicker
                              value={newTaskStart}
                              onChange={(date) => setNewTaskStart(date)}
                              minDate={new Date()}
                              placeholder="시작일 선택"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">종료일</label>
                            <DatePicker
                              value={newTaskEnd}
                              onChange={(date) => setNewTaskEnd(date)}
                              minDate={new Date()}
                              placeholder="종료일 선택"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">담당자</label>
                          <input
                            type="text"
                            placeholder="담당자 입력"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addChildTask(task.id)}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            추가
                          </button>
                          <button
                            onClick={() => {
                              setAddingChildTo(null)
                              setNewTaskName('')
                              setNewTaskStart(null)
                              setNewTaskEnd(null)
                              setNewTaskAssignee('')
                            }}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 상위 작업 추가 모달 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 작업 추가</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="작업명"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">시작일</label>
                  <DatePicker
                    value={newTaskStart}
                    onChange={(date) => setNewTaskStart(date)}
                    minDate={new Date()}
                    placeholder="시작일 선택"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">종료일</label>
                  <DatePicker
                    value={newTaskEnd}
                    onChange={(date) => setNewTaskEnd(date)}
                    minDate={new Date()}
                    placeholder="종료일 선택"
                  />
                </div>
              </div>
              <input
                type="number"
                placeholder="진행률 (%)"
                value={newTaskProgress}
                onChange={(e) => setNewTaskProgress(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                min="0"
                max="100"
              />
              <div>
                <label className="block text-xs text-gray-600 mb-1">담당자</label>
                <input
                  type="text"
                  placeholder="담당자 입력"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={addParentTask}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false)
                  setNewTaskName('')
                  setNewTaskStart(null)
                  setNewTaskEnd(null)
                  setNewTaskProgress(0)
                  setNewTaskAssignee('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">기능 설명</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 각 태스크의 시작일과 종료일을 타임라인에 표시</li>
          <li>• 진행률을 시각적으로 표시 (어두운 영역)</li>
          <li>• 부모 작업에 "+ 하위" 버튼으로 자식 작업 추가 가능</li>
          <li>• 화살표 클릭으로 하위 작업 접기/펼치기</li>
          <li>• 일간/주간/월간 뷰 전환 가능</li>
        </ul>
      </div>
    </div>
  )
}
