/**
 * Utility functions for making direct REST API calls to Google Drive and Google Sheets.
 */

// Find or create a designated folder in Google Drive
export async function findOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!searchRes.ok) {
    throw new Error(`Failed to query Google Drive folder: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Folder not found, create a new one
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }
  
  const folder = await createRes.json();
  return folder.id;
}

// Upload file to Google Drive using multipart upload
export async function uploadFileToFolder(
  accessToken: string,
  folderId: string,
  fileName: string,
  file: File | Blob
): Promise<{ id: string; webViewLink: string }> {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(fileMetadata)], { type: "application/json" })
  );
  form.append("file", file);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file to Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

// Find or create an operational spreadsheet
export async function findOrCreateSpreadsheet(accessToken: string, spreadsheetName: string): Promise<string> {
  const nameQuery = encodeURIComponent(`mimeType='application/vnd.google-apps.spreadsheet' and name='${spreadsheetName}' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${nameQuery}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!searchRes.ok) {
    throw new Error(`Failed to search spreadsheet: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Sheet not found, create new sheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: spreadsheetName,
      },
    }),
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create Google Spreadsheet: ${createRes.statusText}`);
  }
  
  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;
  
  // Initialize header row
  const headers = [
    "Nomor Registrasi",
    "Nama Lengkap",
    "Email",
    "Nomor Telepon",
    "Program Studi",
    "Asal Sekolah",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Jenis Kelamin",
    "Link Pas Foto",
    "Link Scan Ijazah",
    "Tanggal Pendaftaran",
  ];
  
  await appendRowToSpreadsheet(accessToken, spreadsheetId, headers);
  return spreadsheetId;
}

// Append a record row to Google Sheets
export async function appendRowToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  rowValues: any[]
): Promise<any> {
  const range = "Sheet1!A1";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to append row to Google spreadsheet: ${res.statusText}`);
  }
  
  return await res.json();
}

interface GoogleFormResponse {
  formId: string;
  responderUri: string;
}

// Create a customized Google Form under user's Google Account for Admission Registration
export async function createGoogleForm(
  accessToken: string,
  campusName: string,
  majors: { id: string; name: string }[]
): Promise<GoogleFormResponse> {
  const title = `Formulir Pendaftaran Mahasiswa Baru 2026 - ${campusName}`;
  
  // 1. Create the empty form
  const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: {
        title: title,
        documentTitle: `PMB 2026 - ${campusName}`,
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Gagal membuat Google Form: ${createRes.statusText}`);
  }

  const form = await createRes.json();
  const formId = form.formId;
  const responderUri = form.responderUri;

  // 2. Prepare questions
  const majorOptions = majors.map((major) => ({ value: major.name }));

  const requests = [
    {
      createItem: {
        item: {
          title: "Nama Lengkap",
          questionItem: {
            question: {
              required: true,
              textQuestion: {},
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: "Email",
          questionItem: {
            question: {
              required: true,
              textQuestion: {},
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: "Nomor Telepon / WhatsApp",
          questionItem: {
            question: {
              required: true,
              textQuestion: {},
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: "Pilihan Program Studi",
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: "DROP_DOWN",
                options: majorOptions.length > 0 ? majorOptions : [{ value: "Umum" }],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: "Asal Sekolah (SMA/SMK/MA)",
          questionItem: {
            question: {
              required: true,
              textQuestion: {},
            },
          },
        },
        location: { index: 4 },
      },
    },
    {
      createItem: {
        item: {
          title: "Tempat Lahir",
          questionItem: {
            question: {
              required: true,
              textQuestion: {},
            },
          },
        },
        location: { index: 5 },
      },
    },
    {
      createItem: {
        item: {
          title: "Tanggal Lahir",
          questionItem: {
            question: {
              required: true,
              dateQuestion: {
                includeYear: true,
                includeTime: false,
              },
            },
          },
        },
        location: { index: 6 },
      },
    },
    {
      createItem: {
        item: {
          title: "Jenis Kelamin",
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: "RADIO",
                options: [{ value: "Laki-laki" }, { value: "Perempuan" }],
              },
            },
          },
        },
        location: { index: 7 },
      },
    },
  ];

  // 3. Batch Update Form with questions
  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!updateRes.ok) {
    throw new Error(`Gagal mengisi butir pertanyaan Google Form: ${updateRes.statusText}`);
  }

  return { formId, responderUri };
}
