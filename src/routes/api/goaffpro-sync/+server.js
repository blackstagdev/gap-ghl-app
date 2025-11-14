import { json } from '@sveltejs/kit';
import { google } from 'googleapis';

let lastRefCode = null;
let lastCustomerEmail = null;

const GOAFFPRO_API = 'https://api.goaffpro.com/v1/admin';
const SPREADSHEET_ID = '1ZOur_nWFwq3zh0ERci-4AARxbric6EU2-zYWxfogaHE';
const ACCESS_TOKEN = '5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22';

// ✅ GHL API credentials
const GHL_LOCATION_ID = 'YKo6A5vmDaEqPUyWAi1r';
const GHL_API_KEY = 'pit-13bada01-23cd-484e-909c-e9f49fc24546';

// ✅ Google Sheets credentials
const GOOGLE_SERVICE_ACCOUNT_EMAIL = 'ghl-sheets-automation@sheets-automation-472404.iam.gserviceaccount.com';
const GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDVjZ01Aw8zLrSK\nc1XXogBcXqeKI5gBT6kG/zEl3q2jlJRM1R9ypP/cd9Hp6Fl4dFnCxZTRzuPenqgk\nmdD5KEyRBaYxyp3JrL8bCIRjI8jx6jed9XuuUvBgUeOulkU2NXibBdavdzzSfluO\na8nVojeugddhpTNRMDFPyWVvpdW5ReK/qa8+Q/21vejpeqeRnNhjsAIZUP71kxTw\nAolVPaumrvI1mjYhOG1B3i20SwWVdANarwiGKgqowGxNUPE5pDV83A1yvrei5hT2\n7YixpuE6Zck4TcdaDgxpr7zkXwvYLJDcS1Z7r2zAcWNhbxy+sitRPz5uJ4aVqf8l\nA1+XvTBzAgMBAAECggEAArxLKLwuzCmLf4CFt3roRUajH8Zf8phaInBPaVxGXiOP\nmMJcIkRR0LmqMzRaPQxEgBW2188uJRJkNf/QaPimrm7jl5ywU76GPiroQzrYnpyw\n9LGJ0YxXbuxtnbVoEo8xyc6T1vCQk2Ox+YuQ7M8kpnQcVbBfjWkwIIUEax81MyfX\nhyaoy+I+pGOdPUufdRc/MBEVcofbenDJddA7vmEXc4Zoq95jWP2w/6FvHiRILL39\nVBJ6cb+UsYvoQFTl9xOWN9MxvnFu555pl5ugoQKsz19fSQrOo+Fb4bfOEXYE8QPy\nVDxX5i2UiEehjk3qX4hkPgfQupnG792T5Ct9+QyN9QKBgQDwWt6SQOT5eKURA4JW\nMI+0PFFZspvbBLitdpak+ZzjEUUoPKmvXTu1yDn2Ehp+1IteArzVyg2w89DgFki3\ncmwrcnkrjzeRbnkFU7VzHddywVYOMGiCecXQQJM3PBwX7HaXwLOCxq1+P290zdne\nXKn9T0QXlMe0v9fkRDQoYkCitwKBgQDjdCLM7c53KVmayOPPQW1rHCgRkl/A5VY9\n0aS/HteSkrYeDVpGnKM4ECbPUd4YW1AAC53gVLotJW3bH1p4TJ2l5MChqAKLlSYY\n7qAmda4/WDl1rqviUnvXz424p3j1IUM1lV2KqqVRMiE9Hn5RnDIGipQAc6yAXzF5\nVcpyDOu0JQKBgQDRnx7ARTKt1Kd5qCrTCrU6BuUYKqq9IGgEeQm3Ri+q5ZQAHLAM\nzm5WAxNx5aYP+US3MAILHpZEPtBrr2OqAnQOjF7bO6PGBagsmi4FAQC3B6EK7PMo\n4BVCpB8ArD8AKm3fueOVabtEAQUuxJ1/zic/UhNb0Zk+rZYXcdhfZBllDwKBgQC8\nRh2oVBBbQrcREMjBff78ckoYgXkRSsSgVzBvoy/9+8MUDSl02aOhfH0jjziwIKWP\n5A3C619Qj3LntoREn+a+syNgrJmuwL7QVHXsX+zkMjsd1oAgzvYEJaHB/554Chh/\n+it75NUC6OPqm5skIo6mK39nAFkBycpCDWmODnPsoQKBgQCApaJoEVXw7Ktzcz+N\na9uqLeHm4qWBFB98ekMwENYe6mZhMyaEvC9ufWLbn8Mxs1Zd5/KvA5VUTSHYMOf4\niBCtP6DeOCIU1CDgwwopqzoX7yhBwhfbvyU60IioKtkn/7WLRlShmnFnbqzFqdgd\n02E4/RLHiot50t7vX2O1VdFOSA==\n-----END PRIVATE KEY-----\n`;

// ✅ Google Sheets Auth
async function getSheetsClient() {
	let privateKey = GOOGLE_PRIVATE_KEY;
	if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

	const jwtClient = new google.auth.JWT({
		email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
		key: privateKey,
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
	await jwtClient.authorize();
	return google.sheets({ version: 'v4', auth: jwtClient });
}

// ✅ GHL contact lookup
async function getGHLContactByEmail(email) {
	if (!email) return null;

	const url = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`;
	const res = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${GHL_API_KEY}`,
			'Version': '2021-07-28',
			'Accept': 'application/json'
		}
	});

	if (!res.ok) {
		console.warn(`⚠️ GHL lookup failed: ${res.status}`);
		return null;
	}

	const data = await res.json();
	const first = data.contacts?.[0];
	return first ? { id: first.id, name: `${first.firstName ?? ''} ${first.lastName ?? ''}`.trim() } : null;
}

// ========================================================
// ✅ POST → STORE ref_code AND email
// ========================================================
export async function POST({ request }) {
	try {
		const { ref_code, email } = await request.json();

		if (!ref_code || !email) {
			return json(
				{ error: 'Missing ref_code or email in POST request' },
				{ status: 400 }
			);
		}

		lastRefCode = ref_code;
		lastCustomerEmail = email;

		return json({
			message: 'ref_code + email stored successfully',
			ref_code,
			email,
		});
	} catch (err) {
		console.error('POST error:', err);
		return json({ error: err.message }, { status: 500 });
	}
}

// ✅ Get MLM Top-Level Parent + Assigned Owner
async function getTopLevelAffiliate(affiliateId, affiliates) {
	const res = await fetch(`${GOAFFPRO_API}/mlm/parents/${affiliateId}`, {
		headers: {
			'X-GOAFFPRO-ACCESS-TOKEN': ACCESS_TOKEN,
			'Content-Type': 'application/json'
		}
	});

	let topLevel = null;
	if (res.ok) {
		const data = await res.json();
		const parents = data?.parents ?? [];

		if (parents.length > 0) {
			const topParentId = parents[parents.length - 1].id;
			topLevel = affiliates.find(a => a.id === topParentId);
		}
	}

	if (!topLevel) topLevel = affiliates.find(a => a.id === affiliateId);

	const OWNER_MAP = {
		'andrew dorsey': 'BajUT5rjQGnHGP1lNUDr',
		'john roush': 'hdpyoUB6nRTiysyUmTQK',
		'scott riedl': 'VoAjMNrKvRv41DbpVhsA',
		'raoul bowman': 'rjWUeYYFPLEalKgnAD5f',
		'russell o’hare': 'eNQZEXvcLgRfUVYWu2fU',
		'russell o\'hare': 'eNQZEXvcLgRfUVYWu2fU',
		'russell ohare': 'eNQZEXvcLgRfUVYWu2fU',
		'chris han': 'KB2M5YOl6y8Xr92SHztW'
	};

	const topLevelName = topLevel?.name?.toLowerCase().trim();
	const assignedTo = topLevelName ? OWNER_MAP[topLevelName] || null : null;

	return { topLevel, assignedTo };
}

// ✅ Main handler
export async function GET() {
	try {
		// 1️⃣ Ensure POST happened
		if (!lastRefCode || !lastCustomerEmail) {
			return json(
				{ error: 'No POST data stored. Send ref_code + email first.' },
				{ status: 400 }
			);
		}

		// 2️⃣ Fetch affiliates
		const affiliatesRes = await fetch(
			`${GOAFFPRO_API}/affiliates?fields=id,name,email,ref_code`,
			{
				headers: {
					'X-GOAFFPRO-ACCESS-TOKEN': ACCESS_TOKEN,
					'Content-Type': 'application/json',
				},
			}
		);

		const affiliatesData = await affiliatesRes.json();
		const affiliates = affiliatesData.affiliates || [];

		// 3️⃣ Find affiliate by POST'ed ref_code
		const affiliate = affiliates.find(a => a.ref_code === lastRefCode);

		if (!affiliate) {
			return json({ error: `No affiliate found for ref_code ${lastRefCode}` }, { status: 404 });
		}

		const affiliateId = affiliate.id;
		const affiliateName = affiliate.name ?? 'Unknown';
		const affiliateEmail = affiliate.email ?? 'Unknown';

		// 4️⃣ MLM Top-Level Lookup
		const { topLevel, assignedTo } = await getTopLevelAffiliate(affiliateId, affiliates);
		const topLevelId = topLevel?.id ?? null;
		const topLevelName = topLevel?.name ?? 'Unknown';

		// 5️⃣ Customer email from POST
		const customerEmail = lastCustomerEmail;

		// 6️⃣ Lookup GHL contact
		const ghlContact = await getGHLContactByEmail(customerEmail);
		const ghlContactId = ghlContact?.id ?? null;
		const ghlContactName = ghlContact?.name ?? 'Unknown';

		// 7️⃣ Save to Google Sheet
		const sheets = await getSheetsClient();
		await sheets.spreadsheets.values.update({
			spreadsheetId: SPREADSHEET_ID,
			range: 'since!A2:H2',
			valueInputOption: 'RAW',
			requestBody: {
				values: [[
					affiliateId,
					affiliateName,
					affiliateEmail,
					topLevelId,
					topLevelName,
					assignedTo,
					customerEmail,
					ghlContactId
				]]
			}
		});

		// 8️⃣ Response
		return json({
			message: 'Processed affiliate + GHL email successfully',
			connection: {
				affiliateId,
				affiliateName,
				affiliateEmail,
				topLevelId,
				topLevelName,
				assignedTo,
				customerEmail,
				ghlContactId,
				ghlContactName
			}
		});

	} catch (err) {
		console.error('Error fetching or saving:', err);
		return json({ error: err.message }, { status: 500 });
	}
}

