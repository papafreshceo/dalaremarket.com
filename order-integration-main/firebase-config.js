// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCTpN0YHRZ0NrhQoLMAHNEglEhzwlBFoDA",
    authDomain: "order-integration-4c379.firebaseapp.com",
    projectId: "order-integration-4c379",
    storageBucket: "order-integration-4c379.firebasestorage.app",
    messagingSenderId: "695731576846",
    appId: "1:695731576846:web:624c6b9844ea6d33559c5f",
    measurementId: "G-ECH5ZRJF27"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Auth 인스턴스
const auth = firebase.auth();

// Firestore 인스턴스
const db = firebase.firestore();

// Google Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 관리자 이메일 설정 (실제 관리자 이메일로 변경 필요)
const ADMIN_EMAIL = 'papafresh.ceo@gmail.com'; // 여기에 실제 관리자 이메일 입력