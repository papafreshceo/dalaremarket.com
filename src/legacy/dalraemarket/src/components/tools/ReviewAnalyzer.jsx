// src/components/tools/ReviewAnalyzer.jsx
import { useState } from 'react';

function ReviewAnalyzer({ onClose }) {
  const [reviewText, setReviewText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!reviewText) return;
    
    setIsAnalyzing(true);
    
    // 시뮬레이션을 위한 분석 결과 생성
    setTimeout(() => {
      const positiveWords = ['좋아요', '만족', '추천', '최고', '신선', '빠른', '친절'];
      const negativeWords = ['별로', '실망', '불만', '느림', '비싸', '작아', '아쉬워'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (reviewText.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (reviewText.includes(word)) negativeCount++;
      });
      
      const sentiment = positiveCount > negativeCount ? 'positive' : 
                       negativeCount > positiveCount ? 'negative' : 'neutral';
      const score = Math.max(10, Math.min(100, 50 + (positiveCount * 15) - (negativeCount * 20)));
      
      setAnalysis({
        sentiment,
        score,
        keyPoints: [
          '배송 속도에 대한 ' + (sentiment === 'positive' ? '만족' : '개선 필요'),
          '상품 품질 ' + (sentiment === 'positive' ? '우수' : '관리 필요'),
          '가격 대비 만족도 ' + (sentiment === 'positive' ? '높음' : '보통')
        ],
        wordCount: reviewText.split(' ').length,
        suggestions: [
          sentiment === 'positive' ? '긍정 리뷰에 감사 답글 작성' : '부정 리뷰에 정중한 사과와 개선 약속',
          '구체적인 개선 사항 파악 및 반영',
          '리뷰어에게 쿠폰 또는 적립금 제공 고려'
        ]
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getSentimentText = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '긍정적';
      case 'negative': return '부정적';
      default: return '중립적';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          리뷰 분석 도구
        </h3>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          고객 리뷰의 감정을 분석하고 대응 전략을 제안합니다
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '8px' 
        }}>
          리뷰 내용 입력
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="분석하고 싶은 리뷰 내용을 입력하세요..."
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '12px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#6c757d',
          textAlign: 'right'
        }}>
          {reviewText.length}자 입력됨
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!reviewText || isAnalyzing}
        style={{
          width: '100%',
          padding: '14px',
          background: reviewText && !isAnalyzing ? '#2563eb' : '#e9ecef',
          color: reviewText && !isAnalyzing ? '#ffffff' : '#6c757d',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: reviewText && !isAnalyzing ? 'pointer' : 'not-allowed',
          marginBottom: '32px'
        }}
      >
        {isAnalyzing ? '분석 중...' : '리뷰 분석 시작'}
      </button>

      {analysis && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
                감정 분석 결과
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: getSentimentColor(analysis.sentiment)
              }}>
                {getSentimentText(analysis.sentiment)}
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
                긍정도 점수
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#212529' }}>
                {analysis.score}점
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              주요 포인트
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {analysis.keyPoints.map((point, index) => (
                <li key={index} style={{ 
                  fontSize: '14px', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: '#e7f3ff',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              대응 전략 제안
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} style={{ 
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#2563eb', fontSize: '14px' }}>•</span>
                  <span style={{ fontSize: '14px', color: '#495057' }}>
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewAnalyzer;