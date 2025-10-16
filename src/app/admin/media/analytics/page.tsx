'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, Calendar, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface DownloadLog {
  id: number;
  image_id: string;
  ip_address: string;
  user_agent: string;
  downloaded_at: string;
  image?: {
    id: string;
    title: string;
    secure_url: string;
    category: string;
  };
}

interface ImageStats {
  id: string;
  title: string;
  secure_url: string;
  category: string;
  download_count: number;
  view_count: number;
}

export default function MediaAnalyticsPage() {
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [topImages, setTopImages] = useState<ImageStats[]>([]);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    totalImages: 0,
    todayDownloads: 0,
    weekDownloads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cloudinary/analytics');
      const result = await response.json();

      if (result.success) {
        setDownloadLogs(result.data.recentDownloads || []);
        setTopImages(result.data.topImages || []);
        setStats(result.data.stats || {
          totalDownloads: 0,
          totalImages: 0,
          todayDownloads: 0,
          weekDownloads: 0,
        });
      }
    } catch (error) {
      console.error('분석 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">이미지 다운로드 분석</h1>
        <p className="text-gray-600 text-sm mt-1">다운로드 통계 및 로그 확인</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">전체 다운로드</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalDownloads.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">전체 이미지</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalImages.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">오늘 다운로드</p>
                  <p className="text-3xl font-bold mt-2">{stats.todayDownloads.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">최근 7일</p>
                  <p className="text-3xl font-bold mt-2">{stats.weekDownloads.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 이미지 TOP 10 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold">인기 이미지 TOP 10</h2>
                <p className="text-sm text-gray-600 mt-1">다운로드 횟수 기준</p>
              </div>
              <div className="p-6">
                {topImages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">데이터가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {topImages.map((image, index) => (
                      <div key={image.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                          <Image
                            src={image.secure_url}
                            alt={image.title}
                            fill
                            className="object-cover rounded"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{image.title}</p>
                          <p className="text-xs text-gray-500">{image.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-blue-600">{image.download_count}</p>
                          <p className="text-xs text-gray-500">다운로드</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 최근 다운로드 로그 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold">최근 다운로드 로그</h2>
                <p className="text-sm text-gray-600 mt-1">실시간 다운로드 기록</p>
              </div>
              <div className="p-6">
                {downloadLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">로그가 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {downloadLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-2 border-blue-400">
                        {log.image && (
                          <div className="relative w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                            <Image
                              src={log.image.secure_url}
                              alt={log.image.title}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {log.image?.title || '알 수 없는 이미지'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{getBrowserName(log.user_agent)}</span>
                            <span>•</span>
                            <span>{log.ip_address}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(log.downloaded_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
