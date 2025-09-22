
# Car Detailing Website — Phase 1.1 (Polished UI + Google Sheets logging)

This version keeps the MVP features and adds:
- A more conventional website layout (header/nav/footer, cards, responsive styles).
- Customer bookings are saved locally **and** (optionally) logged to a Google Sheet via a simple Apps Script **webhook**.

## Google Sheets "Worksheet" Logging (no server needed)
1) Create a new Google Sheet (name it anything). Note the sheet name (default: `Sheet1`).
2) In the Sheet: Extensions → **Apps Script**. Paste this script:

```javascript
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
    const data = JSON.parse(e.postData.contents);
    // Ensure header row
    const header = ['timestamp','id','customer','phone','service','date','status','source'];
    if (sheet.getLastRow() === 0) sheet.appendRow(header);
    const row = [
      new Date(),
      data.id || '',
      data.customer || '',
      data.phone || '',
      data.service || '',
      data.date || '',
      data.status || 'Pending',
      data.source || 'website'
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ok:true}))
           .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error: String(err)}))
           .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3) Deploy → **New deployment** → type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
   - Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/.../exec`).

4) In `config.js`, set:
```js
export const SHEET_WEBHOOK_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
```

5) Reopen the site and submit a test booking. Rows should appear in your Google Sheet.

> If you can't use Apps Script, you can switch to CSV export from the Manager page, or wire this to any backend (e.g., a small Cloudflare Worker or Next.js API route) by updating `sendToSheet()` in `app.js`.

## Run locally
```bash
python -m http.server 8080
# visit http://localhost:8080
```

## Deploy (Vercel)
- Static site, no build step, output dir: `/`.
- Remember to update `config.js` on the deployed site with your webhook URL.

## Git quick update
```bash
git add .
git commit -m "feat: polished UI + Google Sheets webhook logging"
git push
```
