import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1ZOur_nWFwq3zh0ERci-4AARxbric6EU2-zYWxfogaHE';
const RANGE = 'Sheet1!A2:B2';

// Read last since_id
const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
let since_id = parseInt(res.data.values?.[0]?.[1] || 0);

// After your sync:
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: RANGE,
  valueInputOption: 'RAW',
  requestBody: { values: [['since_id', newSinceId]] }
});
