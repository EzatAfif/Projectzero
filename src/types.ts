export type Role = 'student' | 'lecturer' | 'admin'
export type Student = { id: string; student_id: string; full_name: string; programme: string; semester: number; academic_session: string; email?: string | null; auth_user_id?: string | null }
export type Equipment = { id: string; name: string; available_quantity: number; workshop_id?: string | null }
export type BorrowingRequest = { id: string; applicant_user_id: string; applicant_name: string; applicant_id: string; programme: string; equipment_id: string; quantity: number; purpose: string; borrowing_date: string; expected_return_date: string; workshop_location: string; status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue'; created_at: string; equipment_inventory?: { name: string } }
export type LearningNote = { id: string; title: string; topic: string; programme: string | null; semester: number; course: string; file_path: string; file_name: string; created_at: string }
