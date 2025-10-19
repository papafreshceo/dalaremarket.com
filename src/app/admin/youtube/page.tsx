'use client';

import { useState, useEffect } from 'react';
import { Youtube, RefreshCw, Search, Eye, EyeOff, Trash2, Play, ThumbsUp, Copy, Plus } from 'lucide-react';
import Image from 'next/image';

interface YoutubeVideo {
  id: string;
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  thumbnail_high_url: string;
  published_at: string;
  channel_id: string;
  channel_title: string;
  duration: string;
  view_count: number;
  like_count: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function YoutubeManagementPage() {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVideos();
  }, [currentPage, searchQuery]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/youtube/videos?${params}`);
      const result = await response.json();

      if (result.success) {
        setVideos(result.data);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('영상 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!channelId.trim()) {
      alert('채널 ID를 입력해주세요.');
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`동기화 완료!\n\n채널: ${result.data.channelTitle}\n영상: ${result.data.totalVideos}개`);
        fetchVideos();
      } else {
        alert('동기화 실패: ' + result.error);
      }
    } catch (error) {
      console.error('동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleActive = async (video: YoutubeVideo) => {
    try {
      const response = await fetch('/api/youtube/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id, is_active: !video.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        fetchVideos();
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/youtube/videos?id=${videoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제 완료!');
        fetchVideos();
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDuration = (duration: string) => {
    // ISO 8601 duration을 시:분:초로 변환
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    const parts = [];
    if (hours) parts.push(hours.padStart(2, '0'));
    parts.push((minutes || '0').padStart(2, '0'));
    parts.push((seconds || '0').padStart(2, '0'));

    return parts.join(':');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const addToHtmlBuilder = (video: YoutubeVideo) => {
    // 플로팅 HTML 생성기로 YouTube URL 추가 이벤트 발송
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.video_id}`;
    const event = new CustomEvent('addYoutubeToBuilder', {
      detail: youtubeUrl
    });
    window.dispatchEvent(event);
    alert('HTML 생성기에 추가되었습니다!');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">YouTube 영상 관리</h1>
          <p className="text-gray-600 text-sm mt-1">채널의 영상을 가져와서 관리하세요</p>
        </div>
      </div>

      {/* 채널 동기화 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">채널 동기화</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="YouTube 채널 ID (예: UCxxxxxxxxxxxxxx)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '동기화 중...' : '동기화'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          채널 ID는 YouTube 채널 URL에서 확인할 수 있습니다. (youtube.com/channel/채널ID)
        </p>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="제목 또는 설명 검색..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* 영상 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Youtube size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">영상이 없습니다.</p>
          <p className="text-sm text-gray-500 mt-1">위에서 채널을 동기화해주세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden ${
                  !video.is_active ? 'opacity-50' : ''
                }`}
              >
                {/* 썸네일 */}
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* 재생 시간 */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                  {/* 활성화 상태 */}
                  {!video.is_active && (
                    <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                      비활성
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2" title={video.title}>
                    {video.title}
                  </h3>

                  {/* 통계 */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatNumber(video.view_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      {formatNumber(video.like_count)}
                    </span>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => addToHtmlBuilder(video)}
                      className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                      title="HTML 생성기에 추가"
                    >
                      <Plus size={12} className="inline" />
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 text-center"
                      title="YouTube에서 보기"
                    >
                      <Play size={12} className="inline" />
                    </a>
                    <button
                      onClick={() => toggleActive(video)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      title={video.is_active ? '비활성화' : '활성화'}
                    >
                      {video.is_active ? <Eye size={12} className="inline" /> : <EyeOff size={12} className="inline" />}
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      title="삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* YouTube URL */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs text-gray-600 truncate flex-1" title={`https://www.youtube.com/watch?v=${video.video_id}`}>
                        https://www.youtube.com/watch?v={video.video_id}
                      </span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.video_id}`);
                          alert('URL이 복사되었습니다!');
                        }}
                        className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                        title="URL 복사"
                      >
                        <Copy size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-4 py-2 bg-white border rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
