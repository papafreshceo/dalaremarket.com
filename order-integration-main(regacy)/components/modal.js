// 모던 미니멀 모달 시스템
class MinimalModal {
    constructor() {
        this.currentModal = null;
        this.initStyles();
    }

    initStyles() {
        if (document.getElementById('minimal-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'minimal-modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10000;
            }

            .modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .modal {
                background: white;
                border-radius: 16px;
                max-width: 440px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
            }

            .modal-overlay.active .modal {
                transform: scale(1) translateY(0);
            }

            .modal-minimal {
                padding: 32px;
            }

            .modal-minimal h2 {
                font-size: 22px;
                margin: 0 0 16px 0;
                color: #1a202c;
                font-weight: 600;
                line-height: 1.3;
            }

            .modal-minimal p {
                color: #4a5568;
                line-height: 1.6;
                margin: 0 0 24px 0;
                font-size: 15px;
            }

            .modal-close-btn {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 32px;
                height: 32px;
                background: transparent;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s;
                padding: 0;
            }

            .modal-close-btn:hover {
                background: #f7fafc;
            }

            .modal-close-btn::before,
            .modal-close-btn::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 2px;
                background: #718096;
                border-radius: 2px;
                transition: background 0.2s;
            }

            .modal-close-btn:hover::before,
            .modal-close-btn:hover::after {
                background: #2d3748;
            }

            .modal-close-btn::before {
                transform: rotate(45deg);
            }

            .modal-close-btn::after {
                transform: rotate(-45deg);
            }

            .modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
            }

            .modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                outline: none;
            }

            .modal-btn:active {
                transform: scale(0.98);
            }

            .modal-btn-primary {
                background: #3182ce;
                color: white;
            }

            .modal-btn-primary:hover {
                background: #2c5aa0;
                box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
            }

            .modal-btn-secondary {
                background: #e2e8f0;
                color: #4a5568;
            }

            .modal-btn-secondary:hover {
                background: #cbd5e1;
            }

            .modal-btn-danger {
                background: #e53e3e;
                color: white;
            }

            .modal-btn-danger:hover {
                background: #c53030;
                box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modal-content-animated {
                animation: slideInUp 0.4s ease-out;
            }

            @media (max-width: 768px) {
                .modal {
                    width: 95%;
                    max-width: none;
                }

                .modal-minimal {
                    padding: 24px;
                }

                .modal-actions {
                    flex-direction: column-reverse;
                }

                .modal-btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    async alert(message, title = '알림') {
        return new Promise((resolve) => {
            this.show({
                title,
                message,
                buttons: [
                    {
                        text: '확인',
                        style: 'primary',
                        onClick: () => {
                            this.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    async confirm(message, title = '확인') {
        return new Promise((resolve) => {
            this.show({
                title,
                message,
                buttons: [
                    {
                        text: '취소',
                        style: 'secondary',
                        onClick: () => {
                            this.close();
                            resolve(false);
                        }
                    },
                    {
                        text: '확인',
                        style: 'primary',
                        onClick: () => {
                            this.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    async confirmDelete(message = '정말 삭제하시겠습니까?', title = '삭제 확인') {
        return new Promise((resolve) => {
            this.show({
                title,
                message,
                buttons: [
                    {
                        text: '취소',
                        style: 'secondary',
                        onClick: () => {
                            this.close();
                            resolve(false);
                        }
                    },
                    {
                        text: '삭제',
                        style: 'danger',
                        onClick: () => {
                            this.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    show({ title, message, buttons = [] }) {
        // 기존 모달 제거
        if (this.currentModal) {
            this.close();
        }

        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // 모달 생성
        const modal = document.createElement('div');
        modal.className = 'modal modal-minimal';

        // 닫기 버튼
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-btn';
        closeBtn.onclick = () => {
            this.close();
            // 취소 버튼 찾아서 실행
            const cancelBtn = buttons.find(b => b.style === 'secondary');
            if (cancelBtn && cancelBtn.onClick) {
                cancelBtn.onClick();
            }
        };

        // 콘텐츠
        const content = document.createElement('div');
        content.className = 'modal-content-animated';

        const titleEl = document.createElement('h2');
        titleEl.textContent = title;

        const messageEl = document.createElement('p');
        messageEl.textContent = message;

        // 버튼들
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'modal-actions';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal-btn modal-btn-${btn.style || 'secondary'}`;
            button.textContent = btn.text;
            button.onclick = btn.onClick;
            actionsDiv.appendChild(button);
        });

        // 조립
        content.appendChild(titleEl);
        content.appendChild(messageEl);
        content.appendChild(actionsDiv);

        modal.appendChild(closeBtn);
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 스크롤 방지
        document.body.style.overflow = 'hidden';

        // 애니메이션 시작
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        this.currentModal = overlay;

        // 오버레이 클릭 시 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeBtn.click();
            }
        });

        // ESC 키로 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeBtn.click();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    close() {
        if (!this.currentModal) return;

        this.currentModal.classList.remove('active');
        document.body.style.overflow = '';

        setTimeout(() => {
            if (this.currentModal && this.currentModal.parentNode) {
                this.currentModal.parentNode.removeChild(this.currentModal);
            }
            this.currentModal = null;
        }, 300);
    }
}

// 전역 인스턴스 생성
window.modal = new MinimalModal();

// 기존 alert, confirm 대체 (옵션)
window.modalAlert = (message, title) => window.modal.alert(message, title);
window.modalConfirm = (message, title) => window.modal.confirm(message, title);
window.modalConfirmDelete = (message, title) => window.modal.confirmDelete(message, title);
