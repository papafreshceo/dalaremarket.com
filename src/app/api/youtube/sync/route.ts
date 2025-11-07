import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { channelId } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: '채널 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'YouTube API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 1. 채널의 업로드 플레이리스트 ID 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
    );

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json();
      console.error('YouTube API 오류:', errorData);
      throw new Error(`채널 정보를 가져올 수 없습니다: ${errorData.error?.message || channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: '채널을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    const channelTitle = channelData.items[0].snippet.title;

    // 2. 업로드된 영상 목록 가져오기 (최대 50개)
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
      throw new Error('영상 목록을 가져올 수 없습니다.');
    }

    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);

    // 3. 영상 상세 정보 가져오기 (통계 포함)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`
    );

    if (!videosResponse.ok) {
      throw new Error('영상 상세 정보를 가져올 수 없습니다.');
    }

    const videosData = await videosResponse.json();

    // 4. 데이터베이스에 저장
    const supabase = await createClient();
    const savedVideos = [];

    for (const video of videosData.items) {
      const videoData = {
        video_id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail_url: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
        thumbnail_high_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        published_at: video.snippet.publishedAt,
        channel_id: channelId,
        channel_title: channelTitle,
        duration: video.contentDetails.duration,
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
        tags: video.snippet.tags || [],
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Upsert (존재하면 업데이트, 없으면 삽입)
      const { data, error } = await supabase
        .from('youtube_videos')
        .upsert(videoData, { onConflict: 'video_id' })
        .select()
        .single();

      if (error) {
        console.error('영상 저장 오류:', error);
      } else {
        savedVideos.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        channelTitle,
        totalVideos: savedVideos.length,
        videos: savedVideos,
      },
    });
  } catch (error: any) {
    console.error('YouTube 동기화 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
