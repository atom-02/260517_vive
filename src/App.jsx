import React, { useState, useEffect } from 'react';
import { Menu, Search, Plus, MessageSquare, Image as ImageIcon, Camera, X, Send, Trash2, Edit2 } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './App.css';

// 테스트 유저 정보 (Mock User)
const currentUser = {
  id: 'user_01',
  name: '테스트 학생',
  avatar: 'T'
};

// 고등학교 수학 단원 키워드
const keywords = ['전체보기', '수학(상/하)', '수학Ⅰ', '수학Ⅱ', '미적분', '확률과 통계', '기하'];

// 공지사항 (가짜 데이터)
const notices = [
  { id: 1, type: '필독', title: '질문하기 전 꼭 읽어주세요!' },
  { id: 2, type: '이벤트', title: '이번 주 우수 답변자 발표 🎉' },
];

function App() {
  // 인트로 화면 상태
  const [showIntro, setShowIntro] = useState(true);
  
  // 임시 인트로 배경 이미지 (나중에 사용자가 첨부해주면 이 부분을 교체할 예정)
  const introBackgroundImage = "/Image_intro.png";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState('전체보기');
  const [posts, setPosts] = useState([]);
  
  // 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // 작성 및 수정 상태
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostKeyword, setNewPostKeyword] = useState('수학Ⅰ');
  const [editingPostId, setEditingPostId] = useState(null);

  // 댓글 작성 상태
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImage, setNewCommentImage] = useState(null);

  // 로딩 상태 (이미지 업로드용)
  const [isUploading, setIsUploading] = useState(false);

  // 앱 로드 시 데이터 가져오기 (Firebase 연동)
  useEffect(() => {
    if (!db) {
      setPosts([
        {
          id: 'mock1',
          userId: 'user_02',
          userName: '수학천재',
          text: '이 적분 문제 어떻게 푸는지 아시는 분 있나요? 부분적분 써도 잘 안 풀리네요 ㅠㅠ',
          image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80',
          keyword: '미적분',
          createdAt: new Date().toISOString(),
          comments: []
        }
      ]);
      return;
    }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // 모달 열기 초기화
  const openWriteModal = () => {
    setEditingPostId(null);
    setNewPostText('');
    setNewPostImage(null);
    setNewPostKeyword(activeKeyword === '전체보기' ? '수학Ⅰ' : activeKeyword);
    setIsWriteModalOpen(true);
  };

  // 질문 등록 및 수정 함수
  const handleSubmitPost = async () => {
    if (!newPostText.trim() && !newPostImage) return;

    setIsUploading(true);
    let imageUrl = newPostImage instanceof File ? URL.createObjectURL(newPostImage) : newPostImage;

    // Firebase Storage에 진짜 사진 파일 업로드
    if (db && storage && newPostImage instanceof File) {
      try {
        const imageRef = ref(storage, `posts/${Date.now()}_${newPostImage.name}`);
        const snapshot = await uploadBytes(imageRef, newPostImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error('Image upload failed', error);
        alert('이미지 업로드에 실패했습니다. Storage 규칙을 확인해주세요.');
      }
    }

    const postData = {
      text: newPostText,
      keyword: newPostKeyword,
      image: imageUrl || null
    };

    if (editingPostId) {
      if (db) {
        try {
          await updateDoc(doc(db, 'posts', editingPostId), postData);
        } catch (e) { console.error('Error updating post: ', e); }
      } else {
        setPosts(posts.map(p => p.id === editingPostId ? { ...p, ...postData } : p));
        if (selectedPost && selectedPost.id === editingPostId) {
          setSelectedPost({ ...selectedPost, ...postData });
        }
      }
    } else {
      const newPost = {
        ...postData,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: db ? serverTimestamp() : new Date().toISOString(),
        comments: []
      };

      if (db) {
        try {
          await addDoc(collection(db, 'posts'), newPost);
        } catch (e) { console.error('Error adding post: ', e); }
      } else {
        setPosts([ { ...newPost, id: Date.now().toString() }, ...posts ]);
      }
    }

    setNewPostText('');
    setNewPostImage(null);
    setEditingPostId(null);
    setIsWriteModalOpen(false);
    setIsUploading(false);
  };

  // 삭제 기능
  const handleDeleteClick = async (postId, e) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    if (db) {
      try { await deleteDoc(doc(db, 'posts', postId)); } catch (error) { console.error(error); }
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      if (selectedPost && selectedPost.id === postId) {
        setIsDetailModalOpen(false);
      }
    }
  };

  // 수정 버튼 클릭
  const handleEditClick = (post, e) => {
    e.stopPropagation();
    setEditingPostId(post.id);
    setNewPostText(post.text);
    setNewPostKeyword(post.keyword);
    setNewPostImage(post.image);
    setIsWriteModalOpen(true);
  };

  // 질문 사진 첨부 핸들러
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewPostImage(e.target.files[0]);
    }
  };

  // 댓글(답변) 등록 함수
  const handleSubmitComment = async () => {
    if (!newCommentText.trim() && !newCommentImage) return;

    setIsUploading(true);
    let imageUrl = newCommentImage instanceof File ? URL.createObjectURL(newCommentImage) : null;

    // Firebase Storage에 댓글 사진 파일 업로드
    if (db && storage && newCommentImage instanceof File) {
      try {
        const imageRef = ref(storage, `comments/${Date.now()}_${newCommentImage.name}`);
        const snapshot = await uploadBytes(imageRef, newCommentImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error('Comment image upload failed', error);
        alert('이미지 업로드에 실패했습니다. Storage 규칙을 확인해주세요.');
      }
    }

    const newComment = {
      userId: currentUser.id,
      userName: currentUser.name,
      text: newCommentText,
      image: imageUrl,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(selectedPost.comments || []), newComment];
    
    if (db) {
      try {
        await updateDoc(doc(db, 'posts', selectedPost.id), {
          comments: updatedComments
        });
      } catch(e) { console.error(e); }
    } else {
      const updatedPost = { ...selectedPost, comments: updatedComments };
      setSelectedPost(updatedPost);
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    }
    
    setNewCommentText('');
    setNewCommentImage(null);
    setIsUploading(false);
  };

  // 댓글 사진 첨부 핸들러
  const handleCommentImageChange = (e) => {
    if (e.target.files[0]) {
      setNewCommentImage(e.target.files[0]);
    }
  };

  // 인트로 화면 렌더링
  if (showIntro) {
    return (
      <div className="intro-container" style={{
        backgroundImage: `url('${introBackgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="intro-overlay">
          <h1 className="intro-title">VIVE<span style={{ color: 'var(--primary)' }}>.</span></h1>
          <p className="intro-subtitle">고등학생을 위한 스마트 수학 Q&A</p>
          <button className="btn btn-primary intro-start-btn" onClick={() => setShowIntro(false)}>
            시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 모바일 배경 오버레이 */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* 왼쪽: 키워드 사이드바 */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-title">과목 / 단원 분류</div>
        <div className="keyword-list">
          {keywords.map(kw => (
            <button 
              key={kw} 
              className={`keyword-item ${activeKeyword === kw ? 'active' : ''}`}
              onClick={() => { setActiveKeyword(kw); setIsSidebarOpen(false); }}
            >
              {kw}
            </button>
          ))}
        </div>

        {/* 모바일에서는 공지사항을 사이드바 하단에 표시 */}
        <div className="sidebar-title" style={{ marginTop: 'auto', paddingTop: '20px' }}>공지사항</div>
        <div className="keyword-list">
          {notices.map(notice => (
            <div key={notice.id} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span className="notice-badge" style={{ marginRight: '8px' }}>{notice.type}</span>
              {notice.title}
            </div>
          ))}
        </div>
      </aside>

      {/* 중앙: 질문 게시판 (메인 콘텐츠) */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            VIVE <span style={{ color: 'var(--primary)', fontWeight: '900' }}>.</span>
          </div>
          <div className="avatar">{currentUser.avatar}</div>
        </header>

        <div className="feed-container">
          {posts
            .filter(post => activeKeyword === '전체보기' || post.keyword === activeKeyword)
            .map(post => (
            <div key={post.id} className="post-card animate-slide-up" onClick={() => { setSelectedPost(post); setIsDetailModalOpen(true); }}>
              <div className="post-header">
                <div className="avatar">{post.userName?.[0] || '?'}</div>
                <div className="user-info">
                  <span className="user-name">{post.userName}</span>
                  <span className="post-time">{post.keyword}</span>
                </div>
              </div>
              <p className="post-content">{post.text}</p>
              {post.image && <img src={post.image} alt="질문 첨부 이미지" className="post-image" />}
              <div className="post-footer" style={{ justifyContent: 'space-between' }}>
                <button className="action-btn">
                  <MessageSquare size={18} />
                  댓글 {post.comments?.length || 0}
                </button>
                
                {/* 작성자 본인일 경우 수정/삭제 버튼 표시 */}
                {post.userId === currentUser.id && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={(e) => handleEditClick(post, e)}>
                      <Edit2 size={16} /> 수정
                    </button>
                    <button className="action-btn" onClick={(e) => handleDeleteClick(post.id, e)} style={{ color: 'var(--accent)' }}>
                      <Trash2 size={16} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              해당 분류에 등록된 질문이 없습니다. 첫 번째 질문을 올려보세요!
            </div>
          )}
        </div>

        {/* 글쓰기 플로팅 버튼 */}
        <button className="fab" onClick={openWriteModal}>
          <Plus size={24} />
        </button>
      </main>

      {/* 오른쪽: 공지사항 (데스크탑 전용) */}
      <aside className="notice-column">
        <div className="sidebar-title">공지사항</div>
        {notices.map(notice => (
          <div key={notice.id} className="notice-card animate-fade-in">
            <span className="notice-badge">{notice.type}</span>
            <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{notice.title}</p>
          </div>
        ))}
      </aside>

      {/* 모달: 글쓰기 및 수정 */}
      {isWriteModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>{editingPostId ? '질문 수정하기' : '새 질문 작성'}</h2>
              <button className="btn-icon" onClick={() => setIsWriteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' }}>수학 단원 분류</label>
                <select 
                  value={newPostKeyword} 
                  onChange={(e) => setNewPostKeyword(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                >
                  {keywords.filter(k => k !== '전체보기').map(kw => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>

              <textarea 
                placeholder="어떤 수학 문제가 어렵나요? 궁금한 점을 적어주세요."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />

              {/* 이미지 첨부 영역 (갤러리 / 카메라) */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <label className="upload-area" style={{ flex: 1, padding: '24px', margin: 0 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  <ImageIcon size={32} style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
                  <p style={{ fontSize: '0.9rem' }}>갤러리에서 선택</p>
                </label>
                
                <label className="upload-area" style={{ flex: 1, padding: '24px', margin: 0 }}>
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageChange} />
                  <Camera size={32} style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
                  <p style={{ fontSize: '0.9rem' }}>카메라로 촬영</p>
                </label>
              </div>

              {newPostImage && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {typeof newPostImage === 'string' ? '기존 이미지가 유지됩니다.' : `${newPostImage.name} 첨부됨`}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={handleSubmitPost} disabled={isUploading}>
                  <Send size={18} /> {isUploading ? '업로드 중...' : (editingPostId ? '수정 완료' : '등록하기')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 질문 상세 및 답변 (댓글) 보기 */}
      {isDetailModalOpen && selectedPost && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up" style={{ height: '80vh' }}>
            <div className="modal-header">
              <div className="post-header" style={{ marginBottom: 0 }}>
                <div className="avatar">{selectedPost.userName?.[0] || '?'}</div>
                <div className="user-info">
                  <span className="user-name">{selectedPost.userName}</span>
                  <span className="post-time">{selectedPost.keyword}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              <p className="post-content">{selectedPost.text}</p>
              {selectedPost.image && <img src={selectedPost.image} alt="질문 첨부 이미지" className="post-image" />}
              
              <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0 0 0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                  답변 ({selectedPost.comments?.length || 0})
                </h3>
                {selectedPost.comments?.map((comment, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>{comment.userName?.[0] || '?'}</div>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{comment.userName}</span>
                    </div>
                    <p style={{ marginTop: '4px', lineHeight: '1.5' }}>{comment.text}</p>
                    {/* 답변 이미지 표시 */}
                    {comment.image && (
                      <img src={comment.image} alt="답변 이미지" style={{ width: '100%', maxWidth: '400px', marginTop: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                ))}
                {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '40px 0' }}>아직 답변이 없습니다. 풀이를 안다면 첫 답변을 남겨주세요!</p>
                )}
              </div>
            </div>
            
            {/* 댓글 입력 영역 */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               
               {/* 댓글 이미지 미리보기 */}
               {newCommentImage && (
                  <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
                    <img src={URL.createObjectURL(newCommentImage)} style={{ height: '80px', borderRadius: '8px', border: '1px solid var(--border)' }} alt="댓글 이미지 미리보기" />
                    <button 
                      onClick={() => setNewCommentImage(null)} 
                      style={{ position: 'absolute', top: -8, right: -8, background: 'var(--text-main)', color: 'white', borderRadius: '50%', padding: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={14}/>
                    </button>
                  </div>
               )}

               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 {/* 사진 첨부 버튼 (갤러리) */}
                 <label className="btn-icon" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="갤러리에서 선택">
                   <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCommentImageChange} />
                   <ImageIcon size={20} />
                 </label>

                 {/* 카메라 촬영 버튼 */}
                 <label className="btn-icon" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="카메라로 바로 촬영">
                   <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleCommentImageChange} />
                   <Camera size={20} />
                 </label>
                 
                 {/* 텍스트 입력창 */}
                 <input 
                   type="text" 
                   placeholder="풀이 과정이나 힌트를 입력하세요..." 
                   style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-full)' }} 
                   value={newCommentText}
                   onChange={(e) => setNewCommentText(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                 />
                 
                 {/* 전송 버튼 */}
                 <button 
                   className="btn-icon" 
                   onClick={handleSubmitComment} 
                   style={{ background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)', flexShrink: 0 }}
                   disabled={isUploading}
                 >
                   {isUploading ? <span style={{fontSize: '0.8rem'}}>...</span> : <Send size={18} />}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
