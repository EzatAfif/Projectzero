# Jabatan Seni Kulinari — Portal Pengurusan

React + TypeScript + Tailwind CSS frontend for student records, equipment borrowing requests, and learning resources. The app currently runs as a local demo with in-memory data and no backend services.

## Run locally

```bash
npm install
npm run dev
```

## Features

- Student list with search and programme/semester/session filters, add/edit/delete actions, and CSV/XLS/XLSX bulk import.
- Equipment borrowing request form and manager review actions with local stock checks.
- Learning resource catalog with in-memory file upload/download during the browser session.
- Responsive navigation and Malay/English labels.

Data resets when the page is refreshed. To persist data or restore authentication later, connect a backend or local storage layer and replace the in-memory state in `src/App.tsx`.
