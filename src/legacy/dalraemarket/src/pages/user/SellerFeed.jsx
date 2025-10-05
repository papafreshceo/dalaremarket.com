import { useState, useEffect } from 'react';
import UserHeader from '../../components/layout/UserHeader';

function SellerFeed() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: '달래농장',
      avatar: 'https://via.placeholder.com/40',
      category: 'question',
      title: '토마토 당도 높이는 노하우 공유해주세요',
      content: '올해 처음 토마토 농사를 시작했는데, 당도가 생각보다 낮게 나와서 고민입니다. 선배님들의 조언 부탁드립니다!',
      image: null,
      likes: 42,
      comments: [
        {
          id: 1,
          author: '베테랑농부',
          avatar: 'https://via.placeholder.com/32',
          content: '물 관리가 가장 중요합니다. 수확 2주 전부터는 물을 줄여주세요.',
          time: '1시간 전',
          likes: 5
        },
        {
          id: 2,
          author: '토마토전문가',
          avatar: 'https://via.placeholder.com/32',
          content: '칼슘 비료를 충분히 주시고, 일교차를 크게 해주면 당도가 올라갑니다!',
          time: '30분 전',
          likes: 8
        }
      ],
      views: 234,
      time: '2시간 전',
      isLiked: false,
      tags: ['토마토', '당도', '재배팁']
    },
    {
      id: 2,
      author: '청송사과',
      avatar: 'https://via.placeholder.com/40',
      category: 'tip',
      title: '사과 색깔 예쁘게 내는 방법',
      content: '반사필름 사용 타이밍과 과실 돌리기 시기를 잘 맞추면 색깔이 정말 예쁘게 나옵니다. 제가 사용하는 방법을 공유합니다.',
      image: 'https://via.placeholder.com/600x400',
      likes: 128,
      comments: [
        {
          id: 1,
          author: '초보농부',
          avatar: 'https://via.placeholder.com/32',
          content: '정말 유용한 정보네요! 감사합니다.',
          time: '3시간 전',
          likes: 2
        }
      ],
      views: 567,
      time: '5시간 전',
      isLiked: true,
      tags: ['사과', '착색', '노하우']
    },
    {
      id: 3,
      author: '행복한농부',
      avatar: 'https://via.placeholder.com/40',
      category: 'market',
      title: '이번주 배추 시세 어떤가요?',
      content: '김장철이 다가오는데 배추 가격이 많이 올랐네요. 다른 지역은 어떤지 궁금합니다.',
      image: null,
      likes: 31,
      comments: [],
      views: 892,
      time: '1일 전',
      isLiked: false,
      tags: ['배추', '시세', '김장']
    }
  ]);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'question',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId) => {
    if (!commentInput.trim()) return;

    const newComment = {
      id: Date.now(),
      author: '나의농장',
      avatar: 'https://via.placeholder.com/32',
      content: commentInput,
      time: '방금 전',
      likes: 0
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));

    // 상세 모달도 업데이트
    if (showPostDetail && showPostDetail.id === postId) {
      setShowPostDetail({
        ...showPostDetail,
        comments: [...(showPostDetail.comments || []), newComment]
      });
    }

    setCommentInput('');
  };

  const handleAddTag = (e) => {
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

  const handleRemoveTag = (tagToRemove) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmitPost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 입력해주세요');
      return;
    }

    const post = {
      id: posts.length + 1,
      author: '나의농장',
      avatar: 'https://via.placeholder.com/40',
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
      image: null,
      likes: 0,
      comments: [],
      views: 0,
      time: '방금 전',
      isLiked: false,
      tags: newPost.tags
    };

    setPosts([post, ...posts]);
    setShowWriteModal(false);
    setNewPost({
      title: '',
      content: '',
      category: 'question',
      tags: []
    });
    setTagInput('');
  };

  const categoryColors = {
    question: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
    tip: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
    market: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
    discussion: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }
  };

  const categoryNames = {
    question: '질문',
    tip: '팁공유',
    market: '시세정보',
    discussion: '자유토론'
  };

  return (
    <>
      <UserHeader />
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
              color: '#ffffff',
              marginBottom: '16px'
            }}>
              Seller Feed
            </h1>
            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              농업인들의 소통 공간, 함께 배우고 성장해요
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
              {['all', 'question', 'tip', 'market', 'discussion'].map((filter) => (
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

          {/* 피드 리스트 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {posts
              .filter(post => activeFilter === 'all' || post.category === activeFilter)
              .map(post => (
              <div
                key={post.id}
                onClick={() => setShowPostDetail(post)}
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
                {post.image && (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: `url(${post.image}) center/cover`,
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
                    <img 
                      src={post.avatar} 
                      alt={post.author}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginRight: '12px'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#212529'
                      }}>{post.author}</div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>{post.time}</div>
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
                      {post.comments?.length || 0}
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
                  <img 
                    src={showPostDetail.avatar} 
                    alt=""
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600' }}>{showPostDetail.author}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>{showPostDetail.time}</div>
                  </div>
                </div>
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

              {showPostDetail.image && (
                <img 
                  src={showPostDetail.image}
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
                댓글 {showPostDetail.comments?.length || 0}개
              </h3>

              {showPostDetail.comments && showPostDetail.comments.length > 0 ? (
                showPostDetail.comments.map(comment => (
                  <div key={comment.id} style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <img 
                      src={comment.avatar}
                      alt=""
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%'
                      }}
                    />
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
                        <span>{comment.time}</span>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          cursor: 'pointer'
                        }}>좋아요 {comment.likes > 0 && comment.likes}</button>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          cursor: 'pointer'
                        }}>답글</button>
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
        }} onClick={() => setShowWriteModal(false)}>
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
                onClick={() => setShowWriteModal(false)}
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
                {Object.entries(categoryNames).map(([key, name]) => (
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

            {/* 버튼 */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowWriteModal(false)}
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
    </>
  );
}

export default SellerFeed;