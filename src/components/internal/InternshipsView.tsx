import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Building, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  Star,
  Check,
  AlertCircle
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { 
  StudentProfile, 
  Institution, 
  InternshipAttendance, 
  InternshipEvaluation, 
  User as UserType 
} from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

export const InternshipsView: React.FC = () => {
  const { currentUser, isCounselStaff, isHeadOfChamber, isPrincipalPartner } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'institutions' | 'attendance' | 'evaluations'>('students');

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [attendance, setAttendance] = useState<InternshipAttendance[]>([]);
  const [evaluations, setEvaluations] = useState<InternshipEvaluation[]>([]);
  const [lawyers, setLawyers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student & print
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);

  // New Student Referral Modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    institutionId: 'inst-01',
    programme: 'Bar Part II (B.L) Externship',
    level: 'Bar Vocational',
    matricNumber: '',
    placementType: 'Institution-Referred' as StudentProfile['placementType'],
    placementStartDate: new Date().toISOString().split('T')[0],
    placementEndDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    supervisingCounselId: 'usr-counsel-01'
  });

  // Attendance log modal
  const [isLogAttendanceOpen, setIsLogAttendanceOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '08:15 AM',
    departureTime: '05:00 PM',
    status: 'Present' as InternshipAttendance['status'],
    supervisorNotes: 'Participated in appellate brief research and court attendance.'
  });

  // Evaluation modal
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState({
    punctuality: 5,
    conduct: 5,
    research: 4,
    drafting: 4,
    communication: 5,
    courtroom: 5,
    teamwork: 4,
    confidentiality: 5,
    comments: 'Demonstrated outstanding aptitude in legal research, courtroom decorum, and strict adherence to client confidentiality.',
    recommendCertificate: true
  });

  const loadData = () => {
    setStudents(storageService.getStudents());
    setInstitutions(storageService.getInstitutions());
    setAttendance(storageService.getAttendance());
    setEvaluations(storageService.getEvaluations());
    setLawyers(storageService.getUsers().filter(u => u.role === 'COUNSEL_STAFF' || u.role === 'HEAD_OF_CHAMBER'));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName || !studentForm.matricNumber || !currentUser) return;

    const inst = institutions.find(i => i.id === studentForm.institutionId);

    const created = storageService.registerStudent({
      fullName: studentForm.fullName,
      phone: studentForm.phone,
      email: studentForm.email,
      institutionId: studentForm.institutionId,
      institutionName: inst?.name || 'Faculty of Law',
      faculty: 'Faculty of Law',
      programme: studentForm.programme,
      level: studentForm.level,
      matricNumber: studentForm.matricNumber,
      placementType: studentForm.placementType,
      placementStartDate: studentForm.placementStartDate,
      placementEndDate: studentForm.placementEndDate,
      assignedBranchId: 'br-abuja-01',
      supervisingCounselId: studentForm.supervisingCounselId,
      status: 'Active Placement'
    }, currentUser);

    setIsAddStudentOpen(false);
    setSelectedStudent(created);
  };

  const handleLogAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.studentId || !currentUser) return;

    const student = students.find(s => s.id === attendanceForm.studentId);
    if (!student) return;

    storageService.logAttendance({
      studentId: student.id,
      studentName: student.fullName,
      date: attendanceForm.date,
      arrivalTime: attendanceForm.arrivalTime,
      departureTime: attendanceForm.departureTime,
      status: attendanceForm.status,
      supervisorNotes: attendanceForm.supervisorNotes,
      loggedById: currentUser.id
    }, currentUser);

    setIsLogAttendanceOpen(false);
  };

  const handleCompleteEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentUser) return;

    storageService.submitEvaluation({
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatorCounselId: currentUser.id,
      evaluatorCounselName: currentUser.name,
      punctualityScore: evaluationScores.punctuality,
      professionalConductScore: evaluationScores.conduct,
      legalResearchScore: evaluationScores.research,
      draftingScore: evaluationScores.drafting,
      communicationScore: evaluationScores.communication,
      courtroomObservationScore: evaluationScores.courtroom,
      teamworkScore: evaluationScores.teamwork,
      confidentialityScore: evaluationScores.confidentiality,
      generalPerformanceScore: Math.round((evaluationScores.punctuality + evaluationScores.conduct + evaluationScores.research + evaluationScores.drafting) / 4),
      supervisorComments: evaluationScores.comments,
      recommendedForCertificate: evaluationScores.recommendCertificate
    }, currentUser);

    // Update student completion status
    const certNumber = `BBC-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated: StudentProfile = {
      ...selectedStudent,
      status: 'Completed',
      completionLetterIssued: true,
      certificateNumber: certNumber
    };
    storageService.updateStudent(updated, currentUser);
    setSelectedStudent(updated);
    setIsEvaluationModalOpen(false);
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.institutionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Law Student & Internship Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nigerian Law School Externships · University Clinical Placements · Supervision · Attendance · Evaluations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLogAttendanceOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Log Daily Attendance</span>
          </button>
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Institution Referral</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'students' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students & Externs ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('institutions')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'institutions' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Partner Institutions ({institutions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'attendance' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance Log ({attendance.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'evaluations' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Supervisory Evaluations ({evaluations.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search students by name, Student ID (BBC-INT-), matric number, or institution..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
      </div>

      {/* Students Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Institution & Matric</th>
                  <th className="p-3.5">Programme & Level</th>
                  <th className="p-3.5">Placement Type</th>
                  <th className="p-3.5">Supervising Counsel</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(std => {
                    const supervisor = lawyers.find(l => l.id === std.supervisingCounselId);
                    return (
                      <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{std.studentId}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-900">{std.fullName}</p>
                          <p className="text-[10px] text-slate-400">{std.phone} · {std.email}</p>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          <p className="font-medium">{std.institutionName}</p>
                          <p className="font-mono text-[10px] text-slate-500">{std.matricNumber}</p>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {std.programme} <br />
                          <span className="text-[10px] text-slate-400">{std.level}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{std.placementType}</td>
                        <td className="p-3.5 text-slate-800 font-medium">
                          {supervisor?.name || 'Assigned Counsel'}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            std.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            std.status === 'Active Placement' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {std.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudent(std)}
                            className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                          >
                            Dossier & Evaluation
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partner Institutions Table */}
      {activeTab === 'institutions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Institution Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">State & Location</th>
                  <th className="p-3.5">Contact Person & Official Email</th>
                  <th className="p-3.5">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{inst.code}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{inst.name}</td>
                    <td className="p-3.5 text-slate-600">{inst.type}</td>
                    <td className="p-3.5 text-slate-700">{inst.address}, {inst.state}</td>
                    <td className="p-3.5 text-slate-600">
                      <p className="font-medium text-slate-800">{inst.contactPerson}</p>
                      <p className="text-[10px] text-slate-400">{inst.officialEmail} · {inst.phone}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {inst.relationshipStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Student / Extern Name</th>
                  <th className="p-3.5">Arrival / Departure</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Supervisor Notes / Learning Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No attendance logs recorded for this period.
                    </td>
                  </tr>
                ) : (
                  attendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{att.date}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{att.studentName}</td>
                      <td className="p-3.5 text-slate-700">
                        {att.arrivalTime} — {att.departureTime || 'Pending'}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded ${
                          att.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'Absent' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{att.supervisorNotes || 'No notes entered.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-purple-700 uppercase">
                  {selectedStudent.studentId}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedStudent.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedStudent.institutionName} · {selectedStudent.programme}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Matriculation Number:</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedStudent.matricNumber}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Placement Modality:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedStudent.placementType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Placement Duration:</span>
                <p className="font-medium text-slate-900 mt-0.5">{selectedStudent.placementStartDate} to {selectedStudent.placementEndDate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Supervising Counsel:</span>
                <p className="font-semibold text-amber-900 mt-0.5">
                  {lawyers.find(l => l.id === selectedStudent.supervisingCounselId)?.name || 'Assigned Counsel'}
                </p>
              </div>
            </div>

            {selectedStudent.certificateNumber && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-emerald-900 uppercase">Chambers Completion Certification:</span>
                <p className="font-mono text-slate-900 font-bold">Certificate No: {selectedStudent.certificateNumber}</p>
                <p className="text-slate-600">Formally authorized and stamped by Chambers Senior Partner.</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <button
                onClick={() => setPrintDoc({ type: 'INTERNSHIP_RECORD', data: selectedStudent })}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Placement Dossier</span>
              </button>

              {selectedStudent.status !== 'Completed' && (
                <button
                  onClick={() => setIsEvaluationModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Conduct Final Evaluation & Issue Completion
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conduct Evaluation Modal */}
      {isEvaluationModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Internship Performance Evaluation Rubric
            </h3>
            <p className="text-xs text-slate-500">
              Assessing student performance for <strong>{selectedStudent.fullName}</strong>.
            </p>

            <form onSubmit={handleCompleteEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Punctuality & Attendance (1-5):</label>
                  <select
                    value={evaluationScores.punctuality}
                    onChange={e => setEvaluationScores({ ...evaluationScores, punctuality: Number(e.target.value) })}
                    className="w-full p-2 rounded border bg-white"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Points</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Professional Conduct (1-5):</label>
                  <select
                    value={evaluationScores.conduct}
                    onChange={e => setEvaluationScores({ ...evaluationScores, conduct: Number(e.target.value) })}
                    className="w-full p-2 rounded border bg-white"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Points</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Legal Research Competence (1-5):</label>
                  <select
                    value={evaluationScores.research}
                    onChange={e => setEvaluationScores({ ...evaluationScores, research: Number(e.target.value) })}
                    className="w-full p-2 rounded border bg-white"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Points</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courtroom Observation & Ethics (1-5):</label>
                  <select
                    value={evaluationScores.courtroom}
                    onChange={e => setEvaluationScores({ ...evaluationScores, courtroom: Number(e.target.value) })}
                    className="w-full p-2 rounded border bg-white"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Points</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervisor Written Remarks: *</label>
                <textarea
                  required
                  rows={3}
                  value={evaluationScores.comments}
                  onChange={e => setEvaluationScores({ ...evaluationScores, comments: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recCert"
                  checked={evaluationScores.recommendCertificate}
                  onChange={e => setEvaluationScores({ ...evaluationScores, recommendCertificate: e.target.checked })}
                />
                <label htmlFor="recCert" className="font-semibold text-slate-800">
                  Recommend for Official Chambers Completion Certificate & Letter
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEvaluationModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                >
                  Submit Evaluation & Conclude Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Institution Referral Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Record Institution-Referred Student Placement
            </h3>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name: *</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="Student Full Name"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone: *</label>
                  <input
                    type="tel"
                    required
                    value={studentForm.phone}
                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email: *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referring Institution: *</label>
                  <select
                    value={studentForm.institutionId}
                    onChange={e => setStudentForm({ ...studentForm, institutionId: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matric / Student ID: *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.matricNumber}
                    onChange={e => setStudentForm({ ...studentForm, matricNumber: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Supervising Counsel: *</label>
                <select
                  value={studentForm.supervisingCounselId}
                  onChange={e => setStudentForm({ ...studentForm, supervisingCounselId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  {lawyers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      {isLogAttendanceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Log Daily Student Externship Attendance
            </h3>

            <form onSubmit={handleLogAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student: *</label>
                <select
                  required
                  value={attendanceForm.studentId}
                  onChange={e => setAttendanceForm({ ...attendanceForm, studentId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date: *</label>
                  <input
                    type="date"
                    required
                    value={attendanceForm.date}
                    onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status: *</label>
                  <select
                    value={attendanceForm.status}
                    onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value as InternshipAttendance['status'] })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                    <option value="Approved Leave">Approved Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Learning Activity Log:</label>
                <textarea
                  rows={2}
                  value={attendanceForm.supervisorNotes}
                  onChange={e => setAttendanceForm({ ...attendanceForm, supervisorNotes: e.target.value })}
                  placeholder="Record drafting task, court observation, or research memo completed..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsLogAttendanceOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 rounded font-bold"
                >
                  Save Attendance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printDoc && (
        <PrintDocumentModal
          document={printDoc}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
};
