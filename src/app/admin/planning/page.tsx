'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface Task {
  id: string
  title: string
  time: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

interface Plan {
  id: string
  title: string
  description: string
  tasks: Task[]
  status: 'completed' | 'inProgress' | 'pending'
}

interface Note {
  id: string
  content: string
}

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      title: '거래처 관리',
      description: '신규 거래처 발굴 및 기존 거래처 관리',
      status: 'inProgress',
      tasks: [
        { id: '1-1', title: '거래처 미팅', time: '09:00', completed: false, priority: 'high' },
        { id: '1-2', title: '계약서 검토', time: '11:00', completed: true, priority: 'medium' },
        { id: '1-3', title: '견적서 발송', time: '14:00', completed: false, priority: 'medium' },
      ]
    },
    {
      id: '2',
      title: '재고 관리',
      description: '재고 현황 파악 및 발주 계획',
      status: 'inProgress',
      tasks: [
        { id: '2-1', title: '재고 확인', time: '10:00', completed: true, priority: 'high' },
        { id: '2-2', title: '발주 요청', time: '15:00', completed: false, priority: 'medium' },
      ]
    },
    {
      id: '3',
      title: '시세 분석',
      description: '주간 시세 동향 분석',
      status: 'completed',
      tasks: [
        { id: '3-1', title: '데이터 수집', time: '09:00', completed: true, priority: 'low' },
        { id: '3-2', title: '분석 보고서 작성', time: '14:00', completed: true, priority: 'medium' },
      ]
    },
  ])
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', content: '다음주 납품 일정 확인 필요' }
  ])
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set(['1', '2']))
  const [newNote, setNewNote] = useState('')

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  const toggleTask = (planId: string, taskId: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const updatedTasks = p.tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
        const allCompleted = updatedTasks.every(t => t.completed)
        const anyCompleted = updatedTasks.some(t => t.completed)
        return {
          ...p,
          tasks: updatedTasks,
          status: allCompleted ? 'completed' : anyCompleted ? 'inProgress' : 'pending'
        }
      }
      return p
    }))
  }

  const addNote = () => {
    if (!newNote.trim()) return
    setNotes([...notes, { id: Date.now().toString(), content: newNote }])
    setNewNote('')
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id))
  }

  const formatDate = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      dayOfWeek: days[date.getDay()]
    }
  }

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.completed).length
    return Math.round((completed / tasks.length) * 100)
  }

  const { year, month, day, dayOfWeek } = formatDate(selectedDate)

  const completedPlans = plans.filter(p => p.status === 'completed')
  const inProgressPlans = plans.filter(p => p.status === 'inProgress')
  const pendingPlans = plans.filter(p => p.status === 'pending')

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[16px] font-bold text-gray-900">업무계획</div>
          <div className="text-sm text-gray-500 mt-1">{year}년 {month}월 {day}일 {dayOfWeek}요일</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
          오늘
        </Button>
      </div>

      <div className="flex gap-6">
        {/* 계획 목록 */}
        <div className="flex-1 space-y-4">
          {/* 진행중 계획 */}
          {inProgressPlans.length > 0 && (
            <div className="space-y-2">
              <div className="text-[14px] font-semibold text-gray-900">진행중 계획 ({inProgressPlans.length})</div>
              {inProgressPlans.map((plan) => {
                const progress = calculateProgress(plan.tasks)
                const isExpanded = expandedPlans.has(plan.id)

                return (
                  <div key={plan.id} className="border border-gray-300 bg-white">
                    <div
                      onClick={() => togglePlan(plan.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                          <span className="text-xs text-gray-500">({plan.tasks.length}개 작업)</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{plan.description}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-sm font-bold text-blue-600">{progress}%</div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-2 bg-gray-50">
                        {plan.tasks.map((task) => (
                          <div key={task.id} className="flex items-center p-2 bg-white border border-gray-200">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(plan.id, task.id)}
                              className="w-4 h-4 mr-2 border-2 border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1 text-sm mr-3">
                              <div className={task.completed ? 'line-through text-gray-400' : 'text-gray-900'}>
                                {task.title}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mr-2">{task.time}</div>
                            <span className={`px-2 py-0.5 text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 대기중 계획 */}
          {pendingPlans.length > 0 && (
            <div className="space-y-2">
              <div className="text-[14px] font-semibold text-gray-900">대기중 계획 ({pendingPlans.length})</div>
              {pendingPlans.map((plan) => {
                const progress = calculateProgress(plan.tasks)
                const isExpanded = expandedPlans.has(plan.id)

                return (
                  <div key={plan.id} className="border border-gray-300 bg-white">
                    <div
                      onClick={() => togglePlan(plan.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                          <span className="text-xs text-gray-500">({plan.tasks.length}개 작업)</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{plan.description}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-sm font-bold text-gray-400">{progress}%</div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-2 bg-gray-50">
                        {plan.tasks.map((task) => (
                          <div key={task.id} className="flex items-center p-2 bg-white border border-gray-200">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(plan.id, task.id)}
                              className="w-4 h-4 mr-2 border-2 border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1 text-sm mr-3">
                              <div className={task.completed ? 'line-through text-gray-400' : 'text-gray-900'}>
                                {task.title}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mr-2">{task.time}</div>
                            <span className={`px-2 py-0.5 text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 완료된 계획 */}
          {completedPlans.length > 0 && (
            <div className="space-y-2">
              <div className="text-[14px] font-semibold text-gray-900">완료된 계획 ({completedPlans.length})</div>
              {completedPlans.map((plan) => {
                const progress = calculateProgress(plan.tasks)
                const isExpanded = expandedPlans.has(plan.id)

                return (
                  <div key={plan.id} className="border border-gray-300 bg-gray-50">
                    <div
                      onClick={() => togglePlan(plan.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-500 line-through">{plan.title}</div>
                          <span className="text-xs text-gray-400">({plan.tasks.length}개 작업)</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-sm font-bold text-green-600">{progress}%</div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-2 bg-gray-100">
                        {plan.tasks.map((task) => (
                          <div key={task.id} className="flex items-center p-2 bg-white border border-gray-200">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(plan.id, task.id)}
                              className="w-4 h-4 mr-2 border-2 border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1 text-sm mr-3">
                              <div className={task.completed ? 'line-through text-gray-400' : 'text-gray-900'}>
                                {task.title}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mr-2">{task.time}</div>
                            <span className={`px-2 py-0.5 text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 메모 & 통계 */}
        <div className="w-64 flex-shrink-0 space-y-6">
          {/* 메모 */}
          <div>
            <div className="text-[14px] font-semibold text-gray-900 mb-4">메모</div>

            <div className="space-y-2 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="group flex items-start gap-2 p-3 bg-gray-50 border border-gray-200">
                  <div className="flex-1 text-sm text-gray-700">{note.content}</div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="새 메모 추가..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNote()}
                className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={addNote} size="sm" variant="outline">추가</Button>
            </div>
          </div>

          {/* 통계 */}
          <div>
            <div className="text-[14px] font-semibold text-gray-900 mb-4">이번 주 통계</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">완료한 작업</div>
                <div className="text-sm font-bold text-gray-900">24개</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">평균 완료율</div>
                <div className="text-sm font-bold text-gray-900">78%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">이번 주 목표</div>
                <div className="text-sm font-bold text-gray-900">30개</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
