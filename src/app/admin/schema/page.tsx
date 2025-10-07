'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TableInfo {
  table_name: string
  columns: {
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }[]
}

export default function SchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSchema()
  }, [])

  const fetchSchema = async () => {
    try {
      // SQL로 직접 스키마 정보 가져오기
      const { data, error } = await supabase.rpc('get_schema_info')

      if (error) {
        console.error('Schema fetch error:', error)
        // 수동으로 테이블 정보 구성
        const manualTables: TableInfo[] = [
          {
            table_name: '테이블 정보를 가져올 수 없습니다',
            columns: [
              {
                column_name: 'Supabase Dashboard에서 확인하세요',
                data_type: 'https://supabase.com/dashboard',
                is_nullable: '',
                column_default: null
              }
            ]
          }
        ]
        setTables(manualTables)
      } else if (data) {
        setTables(data)
      }
    } catch (error) {
      console.error('Schema fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schema...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Schema</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          현재 데이터베이스 구조
        </p>
      </div>

      <div className="space-y-4">
        {tables.map((table) => (
          <div
            key={table.table_name}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {table.table_name}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Column</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Nullable</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr
                      key={col.column_name}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 px-3 font-mono text-gray-900 dark:text-white">
                        {col.column_name}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {col.data_type}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {col.is_nullable === 'YES' ? '✓' : '✗'}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {col.column_default || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
