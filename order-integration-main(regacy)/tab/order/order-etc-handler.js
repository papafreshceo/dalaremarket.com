window.OrderEtcHandler = {
    panel: null,
    
    init() {
        this.panel = document.getElementById('om-panel-etc');
        this.createUI();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div style="padding:80px;text-align:center">
                <h3 style="font-size:20px;color:#212529;margin-bottom:16px">기타 기능</h3>
                <p style="color:#6c757d">통계, 리포트 등의 기능이 추가될 예정입니다</p>
            </div>
        `;
    }
};