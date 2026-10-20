// 本機編譯 Tailwind 用設定：產出 css/tailwind.css，網頁執行時不再連線 CDN（金融資料 100% 離線原則）。
module.exports = {
    content: ['./index.html', './js/app.js'],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-hover': 'var(--color-primary-hover)',
                accent: 'var(--color-accent)',
                bg: '#F7F3E9',
                text: '#0F172A',
                // 深紅：在奶油卡片上對比 6.0:1（原 #EF4444 僅 3.7:1）
                danger: '#B91C1C'
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans TC', 'Microsoft JhengHei', 'sans-serif'],
            }
        }
    }
};
