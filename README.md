# Jabatan Seni Kulinari — Portal Pengurusan

React + TypeScript + Tailwind CSS frontend with Supabase Auth, Postgres (RLS), and private Storage for student records, equipment loans, and course resources.

## Run locally

1. Create a Supabase project and copy `.env.example` to `.env`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
3. Create users through Supabase Auth. Assign trusted `app_metadata.role` as `student`, `lecturer`, or `admin` using the Supabase dashboard or a secure server/admin workflow. Do not assign roles from user-editable metadata. Link students' `auth_user_id` to their Auth UUID. Seed workshops and `equipment_inventory` before accepting borrowing requests.
4. Install and start: `npm install && npm run dev`.

The initial admin assignment can be performed in the SQL editor using the statement at the end of the schema (replace the UUID). In production, use a protected administrative process and never expose the service-role key in the browser.

## Implemented

- Semester/programme/academic-session student filters, immediate name/ID search, add/edit/delete with confirmation, and CSV/XLS/XLSX bulk upsert. Import column names accepted include `student_id`/`idpelajar`, `full_name`/`name`/`namapelajar`, `programme`, `semester`, and `academic_session`/`session`.
- Authenticated request form and manager review actions, with inventory reservation enforced by a database trigger in the same transaction. An approval fails and rolls back if available stock is insufficient. Returning approved equipment restores the reserved quantity.
- Course/semester resource catalog, manager upload to a private Storage bucket, and short-lived signed download links.
- Responsive navigation, loading/error states, and Malay/English labels.

## Security notes

RLS is enabled on all six requested tables. Students can read only their linked student row, submit requests only as their own Auth UUID, and read learning-note metadata; managers (trusted `app_metadata.role` of `lecturer` or `admin`) can manage department data. Storage objects are private. The frontend anon key is intended to be public; never ship a Supabase service-role key. Ensure every student has the correct `students.auth_user_id` mapping and seed inventory quantities accurately.
