// /api/planning.js
import { google } from 'googleapis';

// 환경변수에서 스프레드시트 ID 가져오기
const SPREADSHEET_ID = process.env.SPREADSHEET_ID_PLANNING || '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY';

async function authorize() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return await auth.getClient();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, range, data, value, rowIndex } = req.body;

    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });

        switch(action) {
            case 'getData':
                const getResult = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range
                });
                return res.json({ 
                    success: true, 
                    data: getResult.data.values || [] 
                });

            case 'appendData':
                const values = [Object.values(data)];
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values }
                });
                
                return res.json({ success: true });

            case 'updateData':
                // data가 배열인지 확인
                const updateValues = Array.isArray(data) ? data : [Object.values(data)];
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: updateValues }
                });
                
                return res.json({ success: true });

            case 'updateCell':
                // 단일 셀 업데이트
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { 
                        values: [[value]] 
                    }
                });
                
                return res.json({ success: true });

            case 'deleteRow':
                // 실제 행 삭제가 아닌 빈 값으로 덮어쓰기
                const [sheetName, cellRange] = range.split('!');
                const columns = cellRange.match(/[A-Z]+/g);
                let emptyData = [];
                
                if (columns && columns.length === 2) {
                    // 열 범위 계산 (예: A부터 K까지)
                    const startCol = columns[0].charCodeAt(0);
                    const endCol = columns[1].charCodeAt(columns[1].length - 1);
                    const numCols = endCol - startCol + 1;
                    emptyData = [Array(numCols).fill('')];
                } else {
                    // 기본값: 빈 배열 20개
                    emptyData = [Array(20).fill('')];
                }
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: emptyData }
                });
                
                return res.json({ success: true });

            default:
                return res.json({ 
                    success: false, 
                    error: 'Invalid action' 
                });
        }
    } catch (error) {
        console.error('Planning API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}