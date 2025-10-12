'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface Task {
  id: string
  title: string
  dueDate?: string
  completed: boolean
  list: string
}

interface SubPlan {
  id: string
  title: string
  startDate: string
  endDate: string
}

interface Plan {
  id: string
  title: string
  startDate: string
  endDate: string
  subPlans: SubPlan[]
  expanded: boolean
}

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [newPlanStartDate, setNewPlanStartDate] = useState('')
  const [newPlanEndDate, setNewPlanEndDate] = useState('')
  const [addingSubPlanTo, setAddingSubPlanTo] = useState<string | null>(null)
  const [newSubPlanTitle, setNewSubPlanTitle] = useState('')
  const [newSubPlanStartDate, setNewSubPlanStartDate] = useState('')
  const [newSubPlanEndDate, setNewSubPlanEndDate] = useState('')

  // 캘린더 관련 함수
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    // 이전 달 날짜
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const formatDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTasksForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = formatDateString(date)
    return tasks.filter(task => task.dueDate === dateString)
  }

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta))
  }

  // 태스크 관련 함수
  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: selectedDate ? formatDateString(selectedDate) : undefined,
      completed: false,
      list: 'default'
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle('')
  }

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const addPlan = () => {
    if (!newPlanTitle.trim() || !newPlanStartDate || !newPlanEndDate) return

    const newPlan: Plan = {
      id: Date.now().toString(),
      title: newPlanTitle,
      startDate: newPlanStartDate,
      endDate: newPlanEndDate,
      subPlans: [],
      expanded: false
    }

    setPlans([...plans, newPlan])
    setNewPlanTitle('')
    setNewPlanStartDate('')
    setNewPlanEndDate('')
    setShowAddPlan(false)
  }

  const togglePlanExpanded = (planId: string) => {
    setPlans(plans.map(plan =>
      plan.id === planId ? { ...plan, expanded: !plan.expanded } : plan
    ))
  }

  const addSubPlan = (planId: string) => {
    if (!newSubPlanTitle.trim() || !newSubPlanStartDate || !newSubPlanEndDate) return

    const newSubPlan: SubPlan = {
      id: Date.now().toString(),
      title: newSubPlanTitle,
      startDate: newSubPlanStartDate,
      endDate: newSubPlanEndDate
    }

    setPlans(plans.map(plan =>
      plan.id === planId
        ? { ...plan, subPlans: [...plan.subPlans, newSubPlan] }
        : plan
    ))

    setNewSubPlanTitle('')
    setNewSubPlanStartDate('')
    setNewSubPlanEndDate('')
    setAddingSubPlanTo(null)
  }

  const calculatePosition = (startDate: string, endDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    const timelineStart = new Date(today)
    timelineStart.setDate(today.getDate() - 30)

    const daysSinceStart = Math.floor((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // 61일을 100%로 계산
    const leftPercent = (daysSinceStart / 61) * 100
    const widthPercent = (duration / 61) * 100

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    }
  }

  const days = getDaysInMonth(currentDate)
  const incompleteTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)
  const displayTasks = showCompleted ? tasks : incompleteTasks

  return (
    <div className="space-y-6">
      {/* 캘린더 */}
      <div className="w-[800px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentDate(new Date())
                  setSelectedDate(new Date())
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-semibold py-2 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const dayTasks = getTasksForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)
              const isWeekend = index % 7 === 0 || index % 7 === 6

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-lg transition-all relative group ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : isTodayDate
                      ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-white'
                          : isTodayDate
                          ? 'text-blue-600 font-bold'
                          : isWeekend
                          ? index % 7 === 0
                            ? 'text-red-500'
                            : 'text-blue-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    {/* 이벤트 점 표시 */}
                    {dayTasks.length > 0 && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {dayTasks.slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${
                              isTodayDate ? 'bg-blue-600' : 'bg-blue-500'
                            }`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="w-full bg-white border-t border-gray-200">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">타임라인</h3>
          <button
            onClick={() => setShowAddPlan(true)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 계획 추가
          </button>
        </div>

        <div className="relative">
          {/* 날짜 헤더 */}
          <div className="border-b border-gray-200">
            <div className="relative w-full h-12">
              {/* 오늘 세로 바 */}
              <div className="absolute top-0 h-full border-l-2 border-blue-500 z-10" style={{ left: '50%' }}></div>

              {/* 날짜 표시 (10일 간격) */}
              {Array.from({ length: 7 }, (_, i) => {
                const today = new Date()
                const timelineDate = new Date(today)
                timelineDate.setDate(today.getDate() + ((i - 3) * 10))

                const position = ((i - 3) * 10 + 30) / 61 * 100

                return (
                  <div
                    key={timelineDate.toISOString()}
                    className="absolute top-0 h-full flex flex-col justify-center items-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="text-[10px] text-gray-500">
                      {timelineDate.getMonth() + 1}/{timelineDate.getDate()}
                    </div>
                    <div className="text-[10px] mt-1 text-gray-600">
                      {['일', '월', '화', '수', '목', '금', '토'][timelineDate.getDay()]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 계획 목록 */}
          <div>
            {plans.map((plan) => {
              const position = calculatePosition(plan.startDate, plan.endDate)

              return (
                <div key={plan.id} className="border-b border-gray-200">
                  {/* 상위 계획 */}
                  <div className="relative h-12 hover:bg-gray-50">
                    <div className="absolute left-0 top-0 w-48 h-full flex items-center px-4 border-r border-gray-200 bg-white z-10">
                      <button
                        onClick={() => togglePlanExpanded(plan.id)}
                        className="flex items-center gap-2"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${plan.expanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">{plan.title}</span>
                      </button>
                    </div>
                    <div className="ml-48 relative h-full">
                      {/* 오늘 세로 바 */}
                      <div className="absolute top-0 h-full border-l-2 border-blue-500 opacity-20" style={{ left: '50%' }}></div>

                      <div
                        className="absolute top-2 h-8 bg-blue-500 rounded"
                        style={{
                          left: position.left,
                          width: position.width
                        }}
                      >
                        <div className="text-[10px] text-white px-2 py-1 truncate">
                          {plan.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 세부 계획 */}
                  {plan.expanded && (
                    <>
                      {plan.subPlans.map((subPlan) => {
                        const subPosition = calculatePosition(subPlan.startDate, subPlan.endDate)

                        return (
                          <div key={subPlan.id} className="relative h-10 bg-gray-50 hover:bg-gray-100">
                            <div className="absolute left-0 top-0 w-48 h-full flex items-center px-8 border-r border-gray-200 bg-gray-50">
                              <span className="text-xs text-gray-700">{subPlan.title}</span>
                            </div>
                            <div className="ml-48 relative h-full">
                              {/* 오늘 세로 바 */}
                              <div className="absolute top-0 h-full border-l-2 border-blue-500 opacity-20" style={{ left: '50%' }}></div>

                              <div
                                className="absolute top-2 h-6 bg-blue-400 rounded"
                                style={{
                                  left: subPosition.left,
                                  width: subPosition.width
                                }}
                              >
                                <div className="text-[10px] text-white px-2 py-0.5 truncate">
                                  {subPlan.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* 세부 계획 추가 버튼 */}
                      {addingSubPlanTo === plan.id ? (
                        <div className="relative h-12 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center gap-2 px-4 py-2">
                            <input
                              type="text"
                              placeholder="세부 계획명"
                              value={newSubPlanTitle}
                              onChange={(e) => setNewSubPlanTitle(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-40"
                            />
                            <input
                              type="date"
                              value={newSubPlanStartDate}
                              onChange={(e) => setNewSubPlanStartDate(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="date"
                              value={newSubPlanEndDate}
                              onChange={(e) => setNewSubPlanEndDate(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => addSubPlan(plan.id)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              추가
                            </button>
                            <button
                              onClick={() => setAddingSubPlanTo(null)}
                              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-8 bg-gray-50 border-t border-gray-200">
                          <button
                            onClick={() => setAddingSubPlanTo(plan.id)}
                            className="w-full h-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            + 세부 계획 추가
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 계획 추가 모달 */}
        {showAddPlan && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">새 계획 추가</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="계획명"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <span className="self-center text-gray-500">~</span>
                  <input
                    type="date"
                    value={newPlanEndDate}
                    onChange={(e) => setNewPlanEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addPlan}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddPlan(false)
                    setNewPlanTitle('')
                    setNewPlanStartDate('')
                    setNewPlanEndDate('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
