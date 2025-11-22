'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: number;
  author: string;
  content: string;
  created_at: string;
  likes: number;
  isLiked: boolean;
}

interface Post {
  id: number;
  user_id: string;
  author: string;
  category: 'discussion' | 'info' | 'qna' | 'suggestion';
  title: string;
  content: string;
  image_url: string | null;
  likes: number;
  commentsCount: number;
  views: number;
  created_at: string;
  isLiked: boolean;
  tags: string[];
  display_nickname?: string;
}

interface NewPost {
  title: string;
  content: string;
  category: 'discussion' | 'info' | 'qna' | 'suggestion';
  tags: string[];
  display_nickname?: string;
}

interface AdminNickname {
  id: number;
  nickname: string;
  description: string | null;
  is_active: boolean;
}

interface CategoryColors {
  bg: string;
  color: string;
}

type CategoryType = 'discussion' | 'info' | 'qna' | 'suggestion';
type FilterType = 'all' | CategoryType;

export default function SellerFeedPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState<NewPost>({
    title: '',
    content: '',
    category: 'discussion',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [adminNicknames, setAdminNicknames] = useState<AdminNickname[]>([]);
  const [selectedNickname, setSelectedNickname] = useState<string>('');
  const [customNickname, setCustomNickname] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPost, setEditPost] = useState<NewPost & { id: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 게시글 목록 로드
  useEffect(() => {
    loadPosts();
  }, [activeFilter, searchQuery]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    loadCurrentUser();
  }, []);

  // 관리자 닉네임 로드
  useEffect(() => {
    loadAdminNicknames();
  }, []);

  const loadAdminNicknames = async () => {
    try {
      const response = await fetch('/api/admin/nicknames');
      const data = await response.json();

      if (data.success) {
        const activeNicknames = data.nicknames.filter((n: AdminNickname) => n.is_active);
        setAdminNicknames(activeNicknames);
        // 관리자 닉네임을 불러올 수 있다면 관리자로 간주
        setIsAdmin(activeNicknames.length > 0);
      }
    } catch (error) {
      console.error('관리자 닉네임 로드 오류:', error);
      setIsAdmin(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('category', activeFilter);
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/seller-feed/posts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('게시글 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 로드
  const loadComments = async (postId: number) => {
    try {
      const response = await fetch(`/api/seller-feed/posts/${postId}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  };

  // 게시글 좋아요
  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/seller-feed/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, isLiked: data.isLiked, likes: data.likes }
            : post
        ));

        if (showPostDetail && showPostDetail.id === postId) {
          setShowPostDetail({
            ...showPostDetail,
            isLiked: data.isLiked,
            likes: data.likes,
          });
        }
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: number) => {
    if (!commentInput.trim()) return;

    try {
      const response = await fetch(`/api/seller-feed/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput }),
      });
      const data = await response.json();

      if (data.success) {
        await loadComments(postId);
        setCommentInput('');

        // 댓글 수 업데이트
        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        ));

        if (showPostDetail && showPostDetail.id === postId) {
          setShowPostDetail({
            ...showPostDetail,
            commentsCount: showPostDetail.commentsCount + 1,
          });
        }
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    }
  };

  // 태그 추가
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newPost.tags.includes(tagInput.trim())) {
        setNewPost({
          ...newPost,
          tags: [...newPost.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  // 태그 제거
  const handleRemoveTag = (tagToRemove: string) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/seller-feed/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setUploadedImageUrl(data.url);
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지 삭제
  const handleRemoveImage = () => {
    setUploadedImageUrl('');
  };

  // 게시글 작성
  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 입력해주세요');
      return;
    }

    try {
      const finalNickname = selectedNickname === '__custom__' ? customNickname : selectedNickname;
      const postData = {
        ...newPost,
        display_nickname: finalNickname || undefined,
        image_url: uploadedImageUrl || undefined,
      };

      const response = await fetch('/api/seller-feed/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      const data = await response.json();

      if (data.success) {
        setShowWriteModal(false);
        setNewPost({
          title: '',
          content: '',
          category: 'discussion',
          tags: []
        });
        setTagInput('');
        setSelectedNickname('');
        setCustomNickname('');
        setUploadedImageUrl('');
        await loadPosts();
      } else {
        alert(data.error || '게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    }
  };

  // 글쓰기 모달 닫기
  const handleCloseWriteModal = () => {
    setShowWriteModal(false);
    setUploadedImageUrl('');
    setSelectedNickname('');
    setCustomNickname('');
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUploadedImageUrl('');
    setSelectedNickname('');
    setCustomNickname('');
  };

  // 게시글 상세 보기
  const handleShowPostDetail = async (post: Post) => {
    setShowPostDetail(post);
    await loadComments(post.id);

    // 조회수 증가
    try {
      await fetch(`/api/seller-feed/posts/${post.id}/views`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('조회수 증가 오류:', error);
    }
  };

  // 게시글 수정 모달 열기
  const handleEditPost = (post: Post) => {
    setEditPost({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags,
      display_nickname: post.display_nickname,
    });

    // 닉네임 설정: 등록된 닉네임이면 드롭다운에서 선택, 아니면 직접 입력
    if (post.display_nickname) {
      const isRegisteredNickname = adminNicknames.find(n => n.nickname === post.display_nickname);
      if (isRegisteredNickname) {
        setSelectedNickname(post.display_nickname);
        setCustomNickname('');
      } else {
        setSelectedNickname('__custom__');
        setCustomNickname(post.display_nickname);
      }
    } else {
      setSelectedNickname('');
      setCustomNickname('');
    }

    setUploadedImageUrl(post.image_url || '');
    setShowEditModal(true);
    setShowPostDetail(null);
  };

  // 게시글 수정 제출
  const handleSubmitEdit = async () => {
    if (!editPost || !editPost.title.trim() || !editPost.content.trim()) {
      alert('제목과 내용을 입력해주세요');
      return;
    }

    try {
      const finalNickname = selectedNickname === '__custom__' ? customNickname : selectedNickname;
      const response = await fetch(`/api/seller-feed/posts/${editPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPost.title,
          content: editPost.content,
          category: editPost.category,
          tags: editPost.tags,
          image_url: uploadedImageUrl || null,
          display_nickname: finalNickname || null,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setEditPost(null);
        setSelectedNickname('');
        setCustomNickname('');
        setUploadedImageUrl('');
        alert('게시글이 수정되었습니다.');
        await loadPosts();
      } else {
        alert(data.error || '게시글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/seller-feed/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setShowPostDetail(null);
        alert('게시글이 삭제되었습니다.');
        await loadPosts();
      } else {
        alert(data.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

    return date.toLocaleDateString('ko-KR');
  };

  const categoryColors: Record<CategoryType, CategoryColors> = {
    discussion: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
    info: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
    qna: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
    suggestion: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
  };

  const categoryNames: Record<CategoryType, string> = {
    discussion: '자유토론',
    info: '정보공유',
    qna: 'Q&A',
    suggestion: '건의'
  };

  if (!isMounted) return null;

  return (
    <>
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '70px',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '600px',
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 150px, #93c5fd 300px, #bfdbfe 450px, #dbeafe 600px)',
          zIndex: -3
        }} />

        {/* 장식용 원 */}
        <div style={{
          position: 'absolute',
          top: '100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          zIndex: -2
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '20px' : '40px'
        }}>
          {/* 헤더 섹션 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            <h1 style={{
              fontSize: isMobile ? '32px' : '48px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              Seller Feed
            </h1>
            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: '#4b5563'
            }}>
              셀러들의 소통 공간, 함께 배우고 성장해요
            </p>
          </div>

          {/* 필터 탭 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '6px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex',
              gap: '4px',
              overflowX: 'auto',
              maxWidth: '100%'
            }}>
              {(['all', 'discussion', 'info', 'qna', 'suggestion'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '10px 20px',
                    background: activeFilter === filter
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)'
                      : 'transparent',
                    color: activeFilter === filter ? '#ffffff' : '#6c757d',
                    border: 'none',
                    borderRadius: '18px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {filter === 'all' ? '전체' : categoryNames[filter]}
                </button>
              ))}
            </div>
          </div>

          {/* 검색창 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px'
            }}>
              <input
                type="text"
                placeholder="제목, 내용, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '24px',
                  fontSize: '15px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(139, 92, 246, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              ) : (
                <svg
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#999'
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* 글쓰기 버튼 (플로팅) */}
          <button
            onClick={() => setShowWriteModal(true)}
            style={{
              position: 'fixed',
              bottom: isMobile ? '20px' : '40px',
              right: isMobile ? '20px' : '40px',
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            +
          </button>

          {/* 로딩 상태 */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d'
            }}>
              로딩 중...
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d'
            }}>
              게시글이 없습니다. 첫 게시글을 작성해보세요!
            </div>
          ) : (
            /* 피드 리스트 */
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => handleShowPostDetail(post)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(10px)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  {/* 이미지 (있을 경우) */}
                  {post.image_url && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: `url(${post.image_url}) center/cover`,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                    }} />
                  )}

                  <div style={{ padding: '20px' }}>
                    {/* 작성자 정보 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        {post.author[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          color: '#212529'
                        }}>{post.author}</div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6c757d'
                        }}>{formatTime(post.created_at)}</div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        background: categoryColors[post.category].bg,
                        color: categoryColors[post.category].color,
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {categoryNames[post.category]}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#212529',
                      lineHeight: '1.4'
                    }}>{post.title}</h3>

                    {/* 내용 */}
                    <p style={{
                      fontSize: '14px',
                      color: '#495057',
                      lineHeight: '1.6',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{post.content}</p>

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '12px'
                      }}>
                        {post.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '3px 8px',
                              background: '#f1f3f5',
                              color: '#495057',
                              borderRadius: '10px',
                              fontSize: '11px'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 상호작용 버튼 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f3f5'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: post.isLiked ? '#ef4444' : '#6c757d',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={post.isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {post.likes}
                      </button>

                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        {post.commentsCount || 0}
                      </button>

                      <div style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#adb5bd',
                        fontSize: '12px'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {post.views}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 포스트 상세 모달 */}
      {showPostDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowPostDetail(null)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>

            {/* 포스트 헤더 */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f1f3f5'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '18px'
                  }}>
                    {showPostDetail.author[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{showPostDetail.author}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>{formatTime(showPostDetail.created_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 본인 글일 경우 수정/삭제 버튼 표시 */}
                  {currentUserId && showPostDetail.user_id === currentUserId && (
                    <>
                      <button
                        onClick={() => handleEditPost(showPostDetail)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(showPostDetail.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        삭제
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowPostDetail(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      color: '#999',
                      cursor: 'pointer'
                    }}
                  >×</button>
                </div>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>{showPostDetail.title}</h2>

              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#212529'
              }}>{showPostDetail.content}</p>

              {showPostDetail.image_url && (
                <img
                  src={showPostDetail.image_url}
                  alt=""
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    marginTop: '16px'
                  }}
                />
              )}

              {/* 태그 */}
              {showPostDetail.tags && showPostDetail.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginTop: '16px'
                }}>
                  {showPostDetail.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: '#f1f3f5',
                        color: '#495057',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 댓글 섹션 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                댓글 {comments.length}개
              </h3>

              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {comment.author[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '14px',
                          marginBottom: '4px'
                        }}>{comment.author}</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#212529',
                          lineHeight: '1.5'
                        }}>{comment.content}</div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '8px',
                        paddingLeft: '16px',
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        <span>{formatTime(comment.created_at)}</span>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: comment.isLiked ? '#ef4444' : '#6c757d',
                          cursor: 'pointer'
                        }}>좋아요 {comment.likes > 0 && comment.likes}</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '40px 0'
                }}>
                  아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                </div>
              )}
            </div>

            {/* 댓글 입력 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f3f5',
              display: 'flex',
              gap: '12px'
            }}>
              <input
                type="text"
                placeholder="댓글을 입력하세요..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(showPostDetail.id);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleAddComment(showPostDetail.id)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={handleCloseWriteModal}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: isMobile ? '24px' : '32px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600'
              }}>새 글 작성</h2>
              <button
                onClick={handleCloseWriteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer'
                }}
              >×</button>
            </div>

            {/* 카테고리 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
                display: 'block'
              }}>카테고리</label>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {(Object.entries(categoryNames) as [CategoryType, string][]).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setNewPost({ ...newPost, category: key })}
                    style={{
                      padding: '8px 16px',
                      background: newPost.category === key
                        ? categoryColors[key].color
                        : '#f8f9fa',
                      color: newPost.category === key ? 'white' : '#495057',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 관리자 닉네임 선택/입력 (관리자만 표시) */}
            {isAdmin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '8px',
                  display: 'block'
                }}>닉네임 설정 (선택사항)</label>

                {adminNicknames.length > 0 && (
                  <select
                    value={selectedNickname}
                    onChange={(e) => {
                      setSelectedNickname(e.target.value);
                      if (e.target.value !== '__custom__') {
                        setCustomNickname('');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white',
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                  >
                    <option value="">내 닉네임 사용</option>
                    {adminNicknames.map((nickname) => (
                      <option key={nickname.id} value={nickname.nickname}>
                        {nickname.nickname}
                        {nickname.description && ` (${nickname.description})`}
                      </option>
                    ))}
                    <option value="__custom__">직접 입력</option>
                  </select>
                )}

                {(adminNicknames.length === 0 || selectedNickname === '__custom__') && (
                  <input
                    type="text"
                    placeholder="표시할 닉네임을 입력하세요"
                    value={customNickname}
                    onChange={(e) => setCustomNickname(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                )}

                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {adminNicknames.length > 0
                    ? '등록된 닉네임을 선택하거나 직접 입력할 수 있습니다'
                    : '원하는 닉네임을 자유롭게 입력할 수 있습니다'
                  }
                </div>
              </div>
            )}

            {/* 제목 입력 */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* 내용 입력 */}
            <div style={{ marginBottom: '20px' }}>
              <textarea
                placeholder="내용을 입력하세요"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={8}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.6',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* 태그 입력 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
                display: 'block'
              }}>태그</label>
              <input
                type="text"
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleAddTag}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              {newPost.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {newPost.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: '#e7f3ff',
                        color: '#3b82f6',
                        borderRadius: '12px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '16px',
                          lineHeight: '1'
                        }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 이미지 업로드 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
                display: 'block'
              }}>이미지 첨부 (선택사항)</label>

              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              {!uploadedImageUrl ? (
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    padding: '40px',
                    background: '#f8f9fa',
                    border: '2px dashed #dee2e6',
                    borderRadius: '12px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      e.currentTarget.style.background = '#e9ecef';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  {isUploading ? (
                    <>
                      <svg style={{ width: '32px', height: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '32px', height: '32px', color: '#6c757d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>클릭하여 이미지 업로드 (최대 5MB)</span>
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #3b82f6'
                }}>
                  <img
                    src={uploadedImageUrl}
                    alt="업로드된 이미지"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain',
                      background: '#f8f9fa'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.95)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseWriteModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSubmitPost}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                작성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={handleCloseEditModal}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: isMobile ? '24px' : '32px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600'
              }}>게시글 수정</h2>
              <button
                onClick={handleCloseEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer'
                }}
              >×</button>
            </div>

            {/* 카테고리 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
                display: 'block'
              }}>카테고리</label>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {(Object.entries(categoryNames) as [CategoryType, string][]).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setEditPost({ ...editPost, category: key })}
                    style={{
                      padding: '8px 16px',
                      background: editPost.category === key
                        ? categoryColors[key].color
                        : '#f8f9fa',
                      color: editPost.category === key ? 'white' : '#495057',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 관리자 닉네임 선택/입력 (관리자만 표시) */}
            {isAdmin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '8px',
                  display: 'block'
                }}>닉네임 설정 (선택사항)</label>

                {adminNicknames.length > 0 && (
                  <select
                    value={selectedNickname}
                    onChange={(e) => {
                      setSelectedNickname(e.target.value);
                      if (e.target.value !== '__custom__') {
                        setCustomNickname('');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white',
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                  >
                    <option value="">내 닉네임 사용</option>
                    {adminNicknames.map((nickname) => (
                      <option key={nickname.id} value={nickname.nickname}>
                        {nickname.nickname}
                        {nickname.description && ` (${nickname.description})`}
                      </option>
                    ))}
                    <option value="__custom__">직접 입력</option>
                  </select>
                )}

                {(adminNicknames.length === 0 || selectedNickname === '__custom__') && (
                  <input
                    type="text"
                    placeholder="표시할 닉네임을 입력하세요"
                    value={customNickname}
                    onChange={(e) => setCustomNickname(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                )}

                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {adminNicknames.length > 0
                    ? '등록된 닉네임을 선택하거나 직접 입력할 수 있습니다'
                    : '원하는 닉네임을 자유롭게 입력할 수 있습니다'
                  }
                </div>
              </div>
            )}

            {/* 제목 입력 */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={editPost.title}
                onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* 내용 입력 */}
            <div style={{ marginBottom: '20px' }}>
              <textarea
                placeholder="내용을 입력하세요"
                value={editPost.content}
                onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                rows={8}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.6',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* 태그 표시 (읽기 전용) */}
            {editPost.tags && editPost.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '8px',
                  display: 'block'
                }}>태그</label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {editPost.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: '#e7f3ff',
                        color: '#3b82f6',
                        borderRadius: '12px',
                        fontSize: '13px'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 업로드 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
                display: 'block'
              }}>이미지 첨부 (선택사항)</label>

              <input
                type="file"
                id="image-upload-edit"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              {!uploadedImageUrl ? (
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload-edit')?.click()}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    padding: '40px',
                    background: '#f8f9fa',
                    border: '2px dashed #dee2e6',
                    borderRadius: '12px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      e.currentTarget.style.background = '#e9ecef';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  {isUploading ? (
                    <>
                      <svg style={{ width: '32px', height: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '32px', height: '32px', color: '#6c757d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>클릭하여 이미지 업로드 (최대 5MB)</span>
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #3b82f6'
                }}>
                  <img
                    src={uploadedImageUrl}
                    alt="업로드된 이미지"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain',
                      background: '#f8f9fa'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.95)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseEditModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSubmitEdit}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
