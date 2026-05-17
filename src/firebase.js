// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: 파이어베이스 프로젝트 설정(Project Settings) > 일반(General) 탭 아래의 내 앱(Your apps)에서
// Firebase SDK snippet (Config) 내용을 복사하여 아래에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 파이어베이스 초기화 (설정값이 비어있으면 앱이 멈출 수 있으므로 에러 처리)
let app, db, storage;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase 설정이 아직 완료되지 않았습니다.", error);
}

export { db, storage };
