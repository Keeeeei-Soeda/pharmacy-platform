'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  Users, 
  FileText, 
  UserCheck, 
  Clock, 
  Calculator,
  Bell,
  Settings,
  LogOut,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  Building,
  Menu,
  X,
  Edit,
  Save,
  Calendar as CalendarIcon
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { 
  getMyJobs, 
  createJob, 
  updateJob, 
  updateJobStatus,
  deleteJob,
  getApplicationsForPharmacy,
  acceptApplication,
  rejectApplication,
  getMyThreads,
  getMessagesByThread,
  sendMessage,
  getUnreadCount,
  markAsRead,
  logout,
  sendJobOffer,
  getPharmacyContracts,
  getContractDetail,
  getSchedulesByContract,
  getPharmacyProfile,
  updatePharmacyProfile,
  type WorkSchedule,
  type WorkContract,
  type PharmacyProfile
} from '@/lib/api';
import type { JobPosting, JobApplication, MessageThread as APIMessageThread, Message } from '@/lib/api';

type ActiveMenu = '応募確認' | 'メッセージ' | '募集掲載' | '契約管理' | '勤務スケジュール' | 'プロフィール管理' | 'プロフィール' | '費用管理';

interface Employee {
  id: number;
  name: string;
  position: string;
  startDate: string;
  monthlyHours: number;
  hourlyRate: number;
}

export default function PharmacyDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('応募確認');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // API Data States
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Job Posting Form States
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    employmentType: 'part_time' as 'full_time' | 'part_time' | 'temporary' | 'contract',
    minHourlyRate: '',
    maxHourlyRate: '',
    dailyRate: '', // 日給
    workLocation: '',
    workDays: [] as string[],
    scheduledWorkDays: [] as number[], // 勤務予定曜日（0-6）
    workHoursStart: '',
    workHoursEnd: '',
    suggestedStartDate: '', // 希望開始日
    contractDurationDays: '30', // 契約期間（日数）
    requirements: '',
    benefits: [] as string[],
    applicationDeadline: '',
  });
  
  // Application Detail State
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  
  // Messaging States
  const [messageThreads, setMessageThreads] = useState<APIMessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<APIMessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Contract States
  const [contracts, setContracts] = useState<WorkContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<WorkContract | null>(null);
  const [showContractDetail, setShowContractDetail] = useState(false);

  // Schedule States
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [selectedContractForSchedule, setSelectedContractForSchedule] = useState<WorkContract | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  // Profile States
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PharmacyProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const menuItems = [
    { id: '応募確認' as ActiveMenu, label: '薬剤師からの応募確認', icon: Users },
    { id: 'メッセージ' as ActiveMenu, label: 'メッセージ管理', icon: MessageSquare },
    { id: '募集掲載' as ActiveMenu, label: '薬局からの募集掲載', icon: FileText },
    { id: '契約管理' as ActiveMenu, label: '契約管理', icon: FileText },
    { id: '勤務スケジュール' as ActiveMenu, label: '勤務スケジュール管理', icon: CalendarIcon },
    { id: 'プロフィール管理' as ActiveMenu, label: 'プロフィール管理', icon: UserCheck },
    { id: 'プロフィール' as ActiveMenu, label: '採用薬剤師のプロフィール', icon: UserCheck },
    { id: '費用管理' as ActiveMenu, label: '報酬計算と費用管理', icon: Calculator }
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchMessageThreads();
    fetchUnreadCount();
    fetchContracts();
    fetchProfile(); // 🔧 初回ロード時にプロフィールも取得
  }, []);

  // Fetch messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread]);

  // Fetch profile when 'プロフィール管理' tab is selected
  useEffect(() => {
    if (activeMenu === 'プロフィール管理') {
      fetchProfile();
    }
  }, [activeMenu]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getMyJobs();
      setJobPostings(response.jobs);
      setError('');
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('求人の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await getApplicationsForPharmacy();
      setApplications(response.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchMessageThreads = async () => {
    try {
      const response = await getMyThreads();
      setMessageThreads(response.threads);
    } catch (err) {
      console.error('Failed to fetch message threads:', err);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const response = await getMessagesByThread(threadId);
      setMessages(response.messages);
      // Mark as read
      await markAsRead(threadId);
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    try {
      await sendMessage({
        threadId: selectedThread.id,
        content: newMessage.trim()
      });
      
      setNewMessage('');
      // Refresh messages
      fetchMessages(selectedThread.id);
      fetchMessageThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreateJob = async () => {
    setIsSubmitting(true);
    try {
      // Note: pharmacyId should come from user's pharmacy profile
      // For now, we'll need to handle this in the backend or fetch it first
      await createJob({
        pharmacyId: 'temp-pharmacy-id', // This should be fetched from user profile
        title: jobFormData.title,
        description: jobFormData.description,
        employmentType: jobFormData.employmentType,
        minHourlyRate: jobFormData.minHourlyRate ? Number(jobFormData.minHourlyRate) : undefined,
        maxHourlyRate: jobFormData.maxHourlyRate ? Number(jobFormData.maxHourlyRate) : undefined,
        dailyRate: jobFormData.dailyRate ? Number(jobFormData.dailyRate) : undefined,
        workLocation: jobFormData.workLocation,
        workDays: jobFormData.workDays,
        scheduledWorkDays: jobFormData.scheduledWorkDays,
        workHoursStart: jobFormData.workHoursStart,
        workHoursEnd: jobFormData.workHoursEnd,
        suggestedStartDate: jobFormData.suggestedStartDate || undefined,
        contractDurationDays: jobFormData.contractDurationDays ? Number(jobFormData.contractDurationDays) : 30,
        requirements: jobFormData.requirements,
        benefits: jobFormData.benefits,
        applicationDeadline: jobFormData.applicationDeadline || undefined,
      });
      
      alert('求人を投稿しました！');
      setShowJobModal(false);
      resetJobForm();
      fetchJobs();
    } catch (err) {
      console.error('Failed to create job:', err);
      alert('求人の投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    
    setIsSubmitting(true);
    try {
      await updateJob(editingJob.id, {
        title: jobFormData.title,
        description: jobFormData.description,
        employmentType: jobFormData.employmentType,
        minHourlyRate: jobFormData.minHourlyRate ? Number(jobFormData.minHourlyRate) : undefined,
        maxHourlyRate: jobFormData.maxHourlyRate ? Number(jobFormData.maxHourlyRate) : undefined,
        dailyRate: jobFormData.dailyRate ? Number(jobFormData.dailyRate) : undefined,
        workLocation: jobFormData.workLocation,
        workDays: jobFormData.workDays,
        scheduledWorkDays: jobFormData.scheduledWorkDays,
        workHoursStart: jobFormData.workHoursStart,
        workHoursEnd: jobFormData.workHoursEnd,
        suggestedStartDate: jobFormData.suggestedStartDate || undefined,
        contractDurationDays: jobFormData.contractDurationDays ? Number(jobFormData.contractDurationDays) : 30,
        requirements: jobFormData.requirements,
        benefits: jobFormData.benefits,
        applicationDeadline: jobFormData.applicationDeadline || undefined,
      });
      
      alert('求人を更新しました！');
      setShowJobModal(false);
      setEditingJob(null);
      resetJobForm();
      fetchJobs();
    } catch (err) {
      console.error('Failed to update job:', err);
      alert('求人の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      await acceptApplication(applicationId);
      alert('応募を承認しました！メッセージタブで薬剤師とやり取りできます。');
      // 応募データとメッセージスレッドを両方更新
      fetchApplications();
      fetchMessageThreads();
    } catch (err) {
      console.error('Failed to accept application:', err);
      alert('応募の承認に失敗しました');
    }
  };

  const handleRejectApplication = async (applicationId: string, reason?: string) => {
    try {
      await rejectApplication(applicationId, { rejectionReason: reason });
      alert('応募を拒否しました');
      fetchApplications();
    } catch (err) {
      console.error('Failed to reject application:', err);
      alert('応募の拒否に失敗しました');
    }
  };

  // 契約関連の関数
  const fetchContracts = async () => {
    try {
      const response = await getPharmacyContracts();
      setContracts(response?.contracts || []);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setContracts([]); // エラー時は空配列を設定
    }
  };

  // スケジュール取得
  const fetchSchedules = async (contractId: string) => {
    setIsLoadingSchedules(true);
    try {
      const scheduleData = await getSchedulesByContract(contractId);
      setSchedules(scheduleData || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
      alert('スケジュールの取得に失敗しました');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // プロフィール情報取得
  const fetchProfile = async () => {
    try {
      const data = await getPharmacyProfile();
      setProfile(data.profile);
      setProfileForm(data.profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // プロフィール編集開始
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileForm(profile || {});
  };

  // プロフィール編集キャンセル
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm(profile || {});
  };

  // プロフィール保存
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const result = await updatePharmacyProfile(profileForm);
      setProfile(result.profile);
      setIsEditingProfile(false);
      alert('プロフィールを更新しました');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendJobOffer = async (applicationId: string) => {
    if (!confirm('この薬剤師に採用オファーを送信しますか？')) return;
    
    try {
      console.log('Sending job offer for applicationId:', applicationId);
      const result = await sendJobOffer({ applicationId });
      console.log('Job offer sent successfully:', result);
      
      alert('採用オファーを送信しました！薬剤師の承諾をお待ちください。');
      
      // データを再取得
      await Promise.all([
        fetchContracts(),
        fetchApplications(),
        fetchMessageThreads()
      ]);
      
      console.log('Data refreshed. Contracts:', contracts.length);
    } catch (err: unknown) {
      console.error('Failed to send job offer:', err);
      const message =
        err instanceof Error ? err.message : '不明なエラーが発生しました';
      alert(`採用オファーの送信に失敗しました: ${message}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const resetJobForm = () => {
    setJobFormData({
      title: '',
      description: '',
      employmentType: 'part_time',
      minHourlyRate: '',
      maxHourlyRate: '',
      dailyRate: '',
      workLocation: '',
      workDays: [],
      scheduledWorkDays: [],
      workHoursStart: '',
      workHoursEnd: '',
      suggestedStartDate: '',
      contractDurationDays: '30',
      requirements: '',
      benefits: [],
      applicationDeadline: '',
    });
  };

  const openEditJobModal = (job: JobPosting) => {
    setEditingJob(job);
    // 追加項目が型定義に無い場合でも安全に扱う（unknown → narrow）
    const extras = job as unknown as Partial<{
      dailyRate: number | null;
      scheduledWorkDays: number[];
      suggestedStartDate: string | null;
      contractDurationDays: number | null;
    }>;
    setJobFormData({
      title: job.title,
      description: job.description || '',
      employmentType: job.employmentType,
      minHourlyRate: job.minHourlyRate?.toString() || '',
      maxHourlyRate: job.maxHourlyRate?.toString() || '',
      dailyRate: extras.dailyRate?.toString() || '',
      workLocation: job.workLocation || '',
      workDays: job.workDays || [],
      scheduledWorkDays: extras.scheduledWorkDays || [],
      workHoursStart: job.workHoursStart || '',
      workHoursEnd: job.workHoursEnd || '',
      suggestedStartDate: extras.suggestedStartDate
        ? new Date(extras.suggestedStartDate).toISOString().split('T')[0]
        : '',
      contractDurationDays: extras.contractDurationDays?.toString() || '30',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      applicationDeadline: job.applicationDeadline 
        ? new Date(job.applicationDeadline).toISOString().split('T')[0]
        : '',
    });
    setShowJobModal(true);
  };

  // Sample data removed - using API data instead

  const employees: Employee[] = [
    { id: 1, name: '佐藤 太郎', position: '正社員', startDate: '2025-08-01', monthlyHours: 160, hourlyRate: 2500 },
    { id: 2, name: '鈴木 花音', position: 'パート', startDate: '2025-09-01', monthlyHours: 120, hourlyRate: 2200 }
  ];

  // ✅ ハードコードデータを削除: profileステートを使用

  const renderContent = () => {
    switch (activeMenu) {
      case '応募確認':
        const pendingApplications = applications.filter(app => app.status === 'pending' || app.status === 'under_review');
        const statusMap: Record<string, string> = {
          'pending': '新規',
          'under_review': '確認中',
          'interview_scheduled': '面接予定',
          'accepted': '承認済み',
          'rejected': '拒否',
          'withdrawn': '取り下げ'
        };
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">薬剤師からの応募確認</h2>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  {pendingApplications.length}件の新規応募
                </span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">応募情報を読み込んでいます...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">応募がありません</h3>
                <p className="text-gray-600">求人を投稿すると、応募が表示されます</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募者名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">経験年数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">専門分野</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">応募日</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((application) => {
                        const isAccepted = application.status === 'accepted';
                        // 日本式の名前表示（姓 名）
                        const fullName = application.pharmacist?.firstName && application.pharmacist?.lastName
                          ? `${application.pharmacist.lastName} ${application.pharmacist.firstName}`
                          : application.pharmacist?.lastName || '名前未設定';
                        const displayName = isAccepted 
                          ? fullName
                          : `${application.pharmacist?.lastName?.charAt(0)}◯◯ ${application.pharmacist?.firstName?.charAt(0) || '◯'}◯◯`;
                        
                        return (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {displayName}
                            {!isAccepted && (
                              <span className="ml-2 text-xs text-gray-500">(承認後に開示)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.pharmacist?.experienceYears ? `${application.pharmacist.experienceYears}年` : '未記入'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.pharmacist?.specialties?.slice(0, 2).join(', ') || '未記入'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(application.appliedAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {statusMap[application.status] || application.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => setSelectedApplication(application)}
                                className="inline-flex items-center px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                                title="詳細を見る"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              {application.status === 'pending' || application.status === 'under_review' ? (
                                <>
                                  <button 
                                    onClick={() => handleAcceptApplication(application.id)}
                                    className="inline-flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    <CheckCircle className="w-5 h-5 mr-1" />
                                    承認
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const reason = prompt('拒否理由を入力してください（任意）:');
                                      handleRejectApplication(application.id, reason || undefined);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    <XCircle className="w-5 h-5 mr-1" />
                                    拒否
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                  処理済み
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Application Detail Modal */}
            {selectedApplication && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">応募詳細</h3>
                    <button 
                      onClick={() => setSelectedApplication(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        応募者情報
                        {selectedApplication.status !== 'accepted' && (
                          <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            ⚠️ 承認後に詳細情報が開示されます
                          </span>
                        )}
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">名前:</span> 
                          {selectedApplication.status === 'accepted' 
                            ? ` ${selectedApplication.pharmacist?.lastName || ''} ${selectedApplication.pharmacist?.firstName || ''}`
                            : ` ${selectedApplication.pharmacist?.lastName?.charAt(0) || '◯'}◯◯ ${selectedApplication.pharmacist?.firstName?.charAt(0) || '◯'}◯◯`
                          }
                        </p>
                        {selectedApplication.status === 'accepted' && (
                          <>
                            <p>
                              <span className="font-medium">メールアドレス:</span> {selectedApplication.pharmacist?.user?.email || '未登録'}
                            </p>
                            <p>
                              <span className="font-medium">電話番号:</span> {selectedApplication.pharmacist?.phone || '未登録'}
                            </p>
                          </>
                        )}
                        <p><span className="font-medium">経験年数:</span> {selectedApplication.pharmacist?.experienceYears || '未記入'}年</p>
                        <p><span className="font-medium">専門分野:</span> {selectedApplication.pharmacist?.specialties?.join(', ') || '未記入'}</p>
                        <p><span className="font-medium">運転免許:</span> {selectedApplication.pharmacist?.hasDriversLicense ? 'あり' : 'なし'}</p>
                        <p><span className="font-medium">在宅経験:</span> {selectedApplication.pharmacist?.hasHomeCareExperience ? 'あり' : 'なし'}</p>
                      </div>
                    </div>
                    
                    {selectedApplication.coverLetter && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">自己PR・志望動機</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">応募状況</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">ステータス:</span> {statusMap[selectedApplication.status] || selectedApplication.status}</p>
                        <p><span className="font-medium">応募日:</span> {new Date(selectedApplication.appliedAt).toLocaleString('ja-JP')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    {selectedApplication.status === 'pending' || selectedApplication.status === 'under_review' ? (
                      <>
                        <button 
                          onClick={async () => {
                            await handleAcceptApplication(selectedApplication.id);
                            setSelectedApplication(null);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          承認する
                        </button>
                        <button 
                          onClick={async () => {
                            const reason = prompt('拒否理由を入力してください（任意）:');
                            await handleRejectApplication(selectedApplication.id, reason || undefined);
                            setSelectedApplication(null);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          拒否する
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setSelectedApplication(null)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                      >
                        閉じる
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'メッセージ':
        // 承認された応募のメッセージのみを表示
        const acceptedThreads = messageThreads.filter(
          thread => thread.application?.status === 'accepted'
        );
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">メッセージ管理</h2>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">
                  {unreadCount > 0 && `${unreadCount}件の未読メッセージ`}
                </span>
              </div>
            </div>

            {acceptedThreads.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">メッセージがありません</h3>
                <p className="text-gray-600">応募が承認されると、薬剤師とメッセージができます</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                <div className="bg-white rounded-lg shadow h-full overflow-hidden flex flex-col">
                  <div className="p-4 border-b flex-shrink-0">
                    <h3 className="font-semibold">応募者とのやり取り</h3>
                  </div>
                  <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
                    {acceptedThreads.map((thread) => {
                      const lastMsg = thread.messages?.[0];
                      const threadUnread = thread._count?.messages || 0;
                      const pharmacistName = thread.application?.pharmacist 
                        ? `${thread.application.pharmacist.lastName} ${thread.application.pharmacist.firstName}`
                        : '薬剤師名未設定';
                      
                      return (
                        <div 
                          key={thread.id} 
                          onClick={() => setSelectedThread(thread)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">{pharmacistName}</h4>
                            {threadUnread > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {threadUnread}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <>
                              <p className="text-sm text-gray-600 mb-2 truncate">{lastMsg.content}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                  {new Date(lastMsg.createdAt).toLocaleString('ja-JP')}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedThread ? (
                  <div className="md:col-span-2 h-full">
                    {/* メッセージエリア */}
                    <div className="h-full bg-white rounded-lg shadow flex flex-col">
                      <div className="p-4 border-b flex-shrink-0">
                        <h3 className="font-semibold">メッセージ</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedThread.application?.pharmacist 
                            ? `${selectedThread.application.pharmacist.lastName} ${selectedThread.application.pharmacist.firstName}`
                            : '薬剤師名未設定'}
                          {selectedThread.application?.jobPosting?.title && 
                            ` - ${selectedThread.application.jobPosting.title}`
                          }
                        </p>
                      </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          メッセージはまだありません。最初のメッセージを送信しましょう！
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isMyMessage = message.sender.userType === 'pharmacy';
                          
                          return (
                            <div 
                              key={message.id} 
                              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isMyMessage 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isMyMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleString('ja-JP')}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="p-4 border-t flex-shrink-0">
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                          placeholder="メッセージを入力..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSendingMessage}
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={isSendingMessage || !newMessage.trim()}
                          className={`px-4 py-2 rounded-lg text-white ${
                            isSendingMessage || !newMessage.trim()
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {isSendingMessage ? '送信中...' : '送信'}
                        </button>
                      </div>
                      
                      {/* 採用ボタン */}
                      <div className="mt-3 flex justify-end">
                        <div className="w-full max-w-md">
                          {(() => {
                            if (!selectedThread?.application) {
                              return null;
                            }
                            
                            // このapplicationに対して既にオファーが送信されているかチェック
                            const existingContract = contracts.find(
                              c => c.applicationId === selectedThread.application.id
                            );
                            
                            console.log('Debug - applicationId:', selectedThread.application.id);
                            console.log('Debug - contracts:', contracts);
                            console.log('Debug - existingContract:', existingContract);
                            
                            if (existingContract) {
                              const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
                                'pending': { label: '承諾待ち', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: Clock },
                                'active': { label: '契約中', color: 'bg-green-100 text-green-800 border border-green-300', icon: CheckCircle },
                                'rejected': { label: '辞退されました', color: 'bg-red-100 text-red-800 border border-red-300', icon: XCircle },
                                'completed': { label: '契約完了', color: 'bg-blue-100 text-blue-800 border border-blue-300', icon: CheckCircle },
                              };
                              const statusInfo = statusMap[existingContract.status] || { 
                                label: 'オファー送信済み', 
                                color: 'bg-gray-100 text-gray-800 border border-gray-300', 
                                icon: CheckCircle 
                              };
                              const StatusIcon = statusInfo.icon;
                              
                              return (
                                <>
                                  <div className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${statusInfo.color}`}>
                                    <StatusIcon className="w-5 h-5" />
                                    <span>{statusInfo.label}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded border">
                                    <p>
                                      {existingContract.status === 'pending' && '💡 薬剤師の承諾をお待ちください'}
                                      {existingContract.status === 'active' && '✅ 薬剤師が承諾しました。契約が開始されています'}
                                      {existingContract.status === 'rejected' && '❌ 薬剤師がオファーを辞退しました'}
                                      {existingContract.status === 'completed' && '✓ 契約が完了しました'}
                                    </p>
                                  </div>
                                </>
                              );
                            }
                            
                            return (
                              <>
                                <button
                                  onClick={() => handleSendJobOffer(selectedThread.application.id)}
                                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                  <span>この薬剤師を採用する</span>
                                </button>
                                
                                <div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded border">
                                  <p>💡 採用ボタンを押すと、薬剤師に採用オファーが送信されます。</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="md:col-span-2 bg-white rounded-lg shadow flex items-center justify-center p-8">
                    <div className="text-center text-gray-500">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>スレッドを選択してメッセージを表示</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case '契約管理':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">契約管理</h2>
              <div className="text-sm text-gray-600">
                {contracts.length}件の契約
              </div>
            </div>

            {contracts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">契約がありません</h3>
                <p className="text-gray-600">採用オファーを送信すると、ここに契約が表示されます</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">薬剤師名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">求人タイトル</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => {
                      const statusMap: Record<string, { label: string; color: string }> = {
                        'pending': { label: '承諾待ち', color: 'bg-yellow-100 text-yellow-800' },
                        'active': { label: '契約中', color: 'bg-green-100 text-green-800' },
                        'completed': { label: '完了', color: 'bg-blue-100 text-blue-800' },
                        'terminated': { label: '終了', color: 'bg-gray-100 text-gray-800' },
                        'rejected': { label: '辞退', color: 'bg-red-100 text-red-800' }
                      };
                      const statusInfo = statusMap[contract.status] || { label: contract.status, color: 'bg-gray-100 text-gray-800' };
                      
                      return (
                        <tr key={contract.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {contract.pharmacist?.lastName} {contract.pharmacist?.firstName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contract.application?.jobPosting?.title || '求人情報なし'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowContractDetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              詳細を見る
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 契約詳細モーダル */}
            {showContractDetail && selectedContract && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-bold text-gray-800">契約詳細</h3>
                      <button
                        onClick={() => {
                          setShowContractDetail(false);
                          setSelectedContract(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">薬剤師</h4>
                          <p className="text-gray-900">
                            {selectedContract.pharmacist?.lastName} {selectedContract.pharmacist?.firstName}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">ステータス</h4>
                          <p className="text-gray-900">{selectedContract.status}</p>
                        </div>
                      </div>

                      {selectedContract.status === 'active' && selectedContract.terms && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">労働条件通知書</h4>
                          <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                            {selectedContract.terms}
                          </pre>
                        </div>
                      )}

                      {selectedContract.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">
                            💡 薬剤師の承諾をお待ちください。承諾されると労働条件通知書が自動生成されます。
                          </p>
                        </div>
                      )}

                      {selectedContract.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 text-sm">
                            この契約は薬剤師により辞退されました。
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setShowContractDetail(false);
                          setSelectedContract(null);
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case '募集掲載':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">薬局からの募集掲載</h2>
              <button 
                onClick={() => {
                  setEditingJob(null);
                  resetJobForm();
                  setShowJobModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新規募集掲載</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">求人情報を読み込んでいます...</p>
              </div>
            ) : jobPostings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">求人がありません</h3>
                <p className="text-gray-600 mb-4">新規募集を掲載して薬剤師を募集しましょう</p>
                <button 
                  onClick={() => {
                    setEditingJob(null);
                    resetJobForm();
                    setShowJobModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>新規募集掲載</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobPostings.map((job) => {
                  const employmentTypeMap: Record<string, string> = {
                    'full_time': '正社員',
                    'part_time': 'パート',
                    'temporary': '短期',
                    'contract': '契約社員'
                  };
                  
                  const statusMap: Record<string, string> = {
                    'draft': '下書き',
                    'active': '掲載中',
                    'paused': '一時停止',
                    'closed': '募集終了',
                    'expired': '期限切れ'
                  };
                  
                  return (
                    <div key={job.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                          <p className="text-gray-600 mt-2">
                            勤務地: {job.workLocation || '未設定'}
                          </p>
                          <p className="text-gray-600">
                            給与: {job.minHourlyRate && job.maxHourlyRate 
                              ? `¥${job.minHourlyRate.toLocaleString()} - ¥${job.maxHourlyRate.toLocaleString()}/時`
                              : '応相談'}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">
                            雇用形態: {employmentTypeMap[job.employmentType] || job.employmentType}
                          </p>
                          <div className="flex items-center mt-4 space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {statusMap[job.status] || job.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {job.currentApplicants}件の応募
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditJobModal(job)}
                            className="text-blue-600 hover:text-blue-800 p-2 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />編集
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('この求人を削除しますか？')) {
                                try {
                                  await deleteJob(job.id);
                                  alert('求人を削除しました');
                                  fetchJobs();
                                } catch (err) {
                                  alert('削除に失敗しました');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Job Posting Modal */}
            {showJobModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">
                      {editingJob ? '求人を編集' : '新規求人投稿'}
                    </h3>
                    <button 
                      onClick={() => {
                        setShowJobModal(false);
                        setEditingJob(null);
                        resetJobForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editingJob) {
                      handleUpdateJob();
                    } else {
                      handleCreateJob();
                    }
                  }} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        求人タイトル <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={jobFormData.title}
                        onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="例：正社員薬剤師募集"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        求人詳細
                      </label>
                      <textarea 
                        value={jobFormData.description}
                        onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="仕事内容や職場の雰囲気など..."
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          雇用形態 <span className="text-red-500">*</span>
                        </label>
                        <select 
                          value={jobFormData.employmentType}
                          onChange={(e) => setJobFormData({...jobFormData, employmentType: e.target.value as 'full_time' | 'part_time' | 'temporary' | 'contract'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="full_time">正社員</option>
                          <option value="part_time">パート</option>
                          <option value="temporary">短期</option>
                          <option value="contract">契約社員</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          勤務地
                        </label>
                        <input 
                          type="text"
                          value={jobFormData.workLocation}
                          onChange={(e) => setJobFormData({...jobFormData, workLocation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="例：大阪市中央区"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最低時給（円）
                        </label>
                        <input 
                          type="number"
                          value={jobFormData.minHourlyRate}
                          onChange={(e) => setJobFormData({...jobFormData, minHourlyRate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="2500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最高時給（円）
                        </label>
                        <input 
                          type="number"
                          value={jobFormData.maxHourlyRate}
                          onChange={(e) => setJobFormData({...jobFormData, maxHourlyRate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="3000"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-semibold text-blue-900 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        勤務スケジュール設定
                      </h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            日給（円） <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="number"
                            value={jobFormData.dailyRate}
                            onChange={(e) => setJobFormData({...jobFormData, dailyRate: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="20000"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">出勤日数ベースで報酬を計算します</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            契約期間（日数） <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="number"
                            value={jobFormData.contractDurationDays}
                            onChange={(e) => setJobFormData({...jobFormData, contractDurationDays: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="30"
                            min="1"
                            max="30"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">最大30日間</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          勤務予定曜日 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: '日', value: 0 },
                            { label: '月', value: 1 },
                            { label: '火', value: 2 },
                            { label: '水', value: 3 },
                            { label: '木', value: 4 },
                            { label: '金', value: 5 },
                            { label: '土', value: 6 }
                          ].map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                const days = jobFormData.scheduledWorkDays;
                                if (days.includes(day.value)) {
                                  setJobFormData({
                                    ...jobFormData,
                                    scheduledWorkDays: days.filter(d => d !== day.value)
                                  });
                                } else {
                                  setJobFormData({
                                    ...jobFormData,
                                    scheduledWorkDays: [...days, day.value].sort()
                                  });
                                }
                              }}
                              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                jobFormData.scheduledWorkDays.includes(day.value)
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">契約開始後、これらの曜日に自動的にスケジュールが作成されます</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          希望開始日 <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date"
                          value={jobFormData.suggestedStartDate}
                          onChange={(e) => setJobFormData({...jobFormData, suggestedStartDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">薬剤師との調整時の目安になります</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        応募期限 <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">（最短3日後、最長2週間後）</span>
                      </label>
                      <input 
                        type="date"
                        value={jobFormData.applicationDeadline}
                        onChange={(e) => setJobFormData({...jobFormData, applicationDeadline: e.target.value})}
                        min={(() => {
                          const minDate = new Date();
                          minDate.setDate(minDate.getDate() + 3);
                          return minDate.toISOString().split('T')[0];
                        })()}
                        max={(() => {
                          const maxDate = new Date();
                          maxDate.setDate(maxDate.getDate() + 14);
                          return maxDate.toISOString().split('T')[0];
                        })()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          勤務開始時刻
                        </label>
                        <input 
                          type="time"
                          value={jobFormData.workHoursStart}
                          onChange={(e) => setJobFormData({...jobFormData, workHoursStart: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          勤務終了時刻
                        </label>
                        <input 
                          type="time"
                          value={jobFormData.workHoursEnd}
                          onChange={(e) => setJobFormData({...jobFormData, workHoursEnd: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        応募条件・資格
                      </label>
                      <textarea 
                        value={jobFormData.requirements}
                        onChange={(e) => setJobFormData({...jobFormData, requirements: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="例：薬剤師免許、調剤経験3年以上"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowJobModal(false);
                          setEditingJob(null);
                          resetJobForm();
                        }}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800"
                        disabled={isSubmitting}
                      >
                        キャンセル
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-lg text-white ${
                          isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {editingJob ? '更新中...' : '投稿中...'}
                          </>
                        ) : (
                          editingJob ? '更新する' : '投稿する'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'プロフィール管理':
        if (isPreviewMode) {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">プロフィールプレビュー</h2>
                <button 
                  onClick={() => setIsPreviewMode(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  編集に戻る
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{profile?.pharmacyName || '薬局名'}</h3>
                    <p className="text-gray-600">{profile?.address || '住所'}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">基本情報</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">営業時間:</span>
                        <span>{profile?.businessHoursStart && profile?.businessHoursEnd ? `${profile.businessHoursStart} - ${profile.businessHoursEnd}` : '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">定休日:</span>
                        <span>{profile?.closedDays?.join(', ') || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">設立:</span>
                        <span>{profile?.establishedDate || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">処方箋枚数:</span>
                        <span>{profile?.dailyPrescriptionCount ? `約${profile.dailyPrescriptionCount}枚/日` : '未設定'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">基本情報（続き）</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">電話番号:</span>
                        <span>{profile?.phone || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">FAX:</span>
                        <span>{profile?.fax || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最寄り駅:</span>
                        <span>{profile?.nearestStation || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">スタッフ数:</span>
                        <span>{profile?.staffCount ? `${profile.staffCount}名` : '未設定'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">薬局の特徴</h4>
                  <p className="text-gray-700 text-sm mb-4">
                    {profile?.description || '特徴は登録されていません'}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">強み・特色</h5>
                      {profile?.features && profile.features.length > 0 ? (
                        <ul className="space-y-1">
                          {profile.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">登録されていません</p>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">設備・システム</h5>
                      {profile?.facilities && profile.facilities.length > 0 ? (
                        <ul className="space-y-1">
                          {profile.facilities.map((facility, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {facility}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">登録されていません</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール管理</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsPreviewMode(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>プレビュー</span>
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">基本情報</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">薬局名 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.pharmacyName || ''}
                    onChange={(e) => setProfileForm({...profileForm, pharmacyName: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">住所 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.address || ''}
                    onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FAX</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.fax || ''}
                    onChange={(e) => setProfileForm({...profileForm, fax: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">営業開始時間</label>
                  <input 
                    type="time" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.businessHoursStart || ''}
                    onChange={(e) => setProfileForm({...profileForm, businessHoursStart: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">営業終了時間</label>
                  <input 
                    type="time" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.businessHoursEnd || ''}
                    onChange={(e) => setProfileForm({...profileForm, businessHoursEnd: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">追加情報</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最寄り駅</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.nearestStation || ''}
                    onChange={(e) => setProfileForm({...profileForm, nearestStation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">設立日</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.establishedDate || ''}
                    onChange={(e) => setProfileForm({...profileForm, establishedDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">1日の処方箋枚数</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.dailyPrescriptionCount || ''}
                    onChange={(e) => setProfileForm({...profileForm, dailyPrescriptionCount: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">スタッフ数</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    value={profileForm.staffCount || ''}
                    onChange={(e) => setProfileForm({...profileForm, staffCount: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">薬局の特徴</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">薬局の紹介文</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={profileForm.description || ''}
                    onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );

      case '費用管理':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">1ヶ月の勤務時間と費用</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm text-blue-600">総勤務時間</p>
                    <p className="text-2xl font-bold text-blue-800">280時間</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm text-green-600">総人件費</p>
                    <p className="text-2xl font-bold text-green-800">¥664,000</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm text-yellow-600">雇用中薬剤師</p>
                    <p className="text-2xl font-bold text-yellow-800">2名</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">薬剤師別費用詳細</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">薬剤師名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">雇用形態</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">勤務時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時給</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月額給与</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.monthlyHours}時間</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{employee.hourlyRate.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ¥{(employee.monthlyHours * employee.hourlyRate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '勤務スケジュール':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">勤務スケジュール管理</h2>
            </div>

            {/* 重要なお知らせ */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-900 font-semibold mb-2 flex items-center">
                <span className="mr-2">⚠️</span> 日程変更について
              </h3>
              <p className="text-sm text-yellow-800">
                急な欠勤や追加出勤などのスケジュール変更は、必ず<strong>電話</strong>でご連絡ください。
                メッセージでの変更は確認漏れの原因となるため、お控えください。
              </p>
            </div>

            {!selectedContractForSchedule ? (
              /* 契約選択画面 */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">契約を選択してください</h3>
                <p className="text-sm text-gray-600 mt-1">
                    アクティブな契約の勤務スケジュールを確認できます
                </p>
              </div>
              
              {contracts.filter(c => c.status === 'active').length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">アクティブな契約がありません</h3>
                  <p className="text-gray-600">薬剤師との契約が承認されると、ここに表示されます</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {contracts.filter(c => c.status === 'active').map((contract) => (
                    <div key={contract.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {contract.pharmacist?.lastName} {contract.pharmacist?.firstName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            求人: {contract.application?.jobPosting?.title || '求人情報なし'}
                          </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>契約期間: {contract.contractStartDate ? new Date(contract.contractStartDate).toLocaleDateString('ja-JP') : '未設定'} ～ {contract.contractEndDate ? new Date(contract.contractEndDate).toLocaleDateString('ja-JP') : '未設定'}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                                setSelectedContractForSchedule(contract);
                                fetchSchedules(contract.id);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                          >
                            <CalendarIcon className="w-5 h-5" />
                              <span>スケジュール表示</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            ) : (
              /* カレンダー表示画面 */
              <div className="space-y-6">
                {/* ヘッダー */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          setSelectedContractForSchedule(null);
                          setSchedules([]);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ← 戻る
                      </button>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {selectedContractForSchedule.pharmacist?.lastName} {selectedContractForSchedule.pharmacist?.firstName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedContractForSchedule.application?.jobPosting?.title || '求人情報なし'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCalendarView('month')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          calendarView === 'month'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        月間
                      </button>
                      <button
                        onClick={() => setCalendarView('week')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          calendarView === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        週間
                      </button>
                    </div>
            </div>

                  {/* 契約情報 */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">契約期間</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedContractForSchedule.contractStartDate 
                          ? new Date(selectedContractForSchedule.contractStartDate).toLocaleDateString('ja-JP') 
                          : '未設定'} ～ {selectedContractForSchedule.contractEndDate 
                          ? new Date(selectedContractForSchedule.contractEndDate).toLocaleDateString('ja-JP') 
                          : '未設定'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">予定出勤日数</p>
                      <p className="text-sm font-medium text-gray-900">{schedules.length}日</p>
                    </div>
                  </div>
                </div>

                {/* カレンダー */}
                <div className="bg-white rounded-lg shadow p-6">
                  {isLoadingSchedules ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-4 text-gray-600">スケジュールを読み込んでいます...</p>
                    </div>
                  ) : calendarView === 'month' ? (
                    /* 月間ビュー */
                    <div className="pharmacy-calendar">
                      <Calendar
                        value={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date as Date);
                          const dateStr = (date as Date).toISOString().split('T')[0];
                          const schedule = schedules.find(s => s.workDate.split('T')[0] === dateStr);
                          if (schedule) {
                            setSelectedSchedule(schedule);
                            setShowScheduleDetail(true);
                          }
                        }}
                        tileClassName={({ date }) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const hasSchedule = schedules.some(s => s.workDate.split('T')[0] === dateStr);
                          return hasSchedule ? 'schedule-day' : '';
                        }}
                        tileContent={({ date }) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const schedule = schedules.find(s => s.workDate.split('T')[0] === dateStr);
                          if (schedule) {
                            return (
                              <div className="text-xs mt-1">
                                <div className="text-blue-600 font-medium">
                                  {schedule.scheduledStartTime?.substring(11, 16)} - {schedule.scheduledEndTime?.substring(11, 16)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        locale="ja-JP"
                      />
                    </div>
                  ) : (
                    /* 週間ビュー */
                    <div className="space-y-4">
                      {/* 週ナビゲーション */}
                      <div className="flex items-center justify-between border-b pb-4">
                        <button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() - 7);
                            setSelectedDate(newDate);
                          }}
                          className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
                        >
                          ← 前週
                        </button>
                        <div className="text-lg font-semibold">
                          {(() => {
                            const start = new Date(selectedDate);
                            start.setDate(start.getDate() - start.getDay());
                            const end = new Date(start);
                            end.setDate(end.getDate() + 6);
                            return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
                          })()}
                        </div>
                        <button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() + 7);
                            setSelectedDate(newDate);
                          }}
                          className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
                        >
                          次週 →
                        </button>
                      </div>

                      {/* 週間スケジュールリスト */}
                      <div className="grid grid-cols-1 gap-3">
                        {(() => {
                          const weekStart = new Date(selectedDate);
                          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                          
                          return Array.from({ length: 7 }, (_, i) => {
                            const date = new Date(weekStart);
                            date.setDate(date.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const daySchedule = schedules.find(s => s.workDate.split('T')[0] === dateStr);
                            
                            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                            const isWeekend = i === 0 || i === 6;
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            
                            return (
                              <div
                                key={i}
                                className={`border rounded-lg p-4 transition-all ${
                                  daySchedule
                                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer'
                                    : 'bg-gray-50 border-gray-200'
                                } ${isToday ? 'ring-2 ring-yellow-400' : ''}`}
                                onClick={() => {
                                  if (daySchedule) {
                                    setSelectedSchedule(daySchedule);
                                    setShowScheduleDetail(true);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`text-center ${isWeekend ? 'text-red-600' : 'text-gray-700'}`}>
                                      <div className="text-xs font-medium">{dayNames[i]}</div>
                                      <div className="text-2xl font-bold">{date.getDate()}</div>
                                    </div>
                                    {daySchedule ? (
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                          <span className="font-semibold text-blue-900">
                                            {daySchedule.scheduledStartTime?.substring(11, 16)} - {daySchedule.scheduledEndTime?.substring(11, 16)}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          休憩 {daySchedule.breakTimeMinutes}分
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400">休日</div>
                                    )}
                                  </div>
                                  {daySchedule && (
                                    <div className="text-blue-600">
                                      <Eye className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {schedules.length === 0 && !isLoadingSchedules && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">このcontractにスケジュールが登録されていません</p>
                      <p className="text-sm text-gray-500 mt-2">契約承諾時に自動的にスケジュールが作成されます</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-blue-900 font-semibold mb-2">💡 スケジュール表示について</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 青色でハイライトされた日が勤務予定日です</li>
                    <li>• 日付をクリックすると、その日のスケジュール詳細が表示されます</li>
                    <li>• スケジュールは契約承諾時に自動作成されています</li>
              </ul>
            </div>
              </div>
            )}

            {/* スケジュール詳細モーダル */}
            {showScheduleDetail && selectedSchedule && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">📅 勤務スケジュール詳細</h3>
                    <button
                      onClick={() => {
                        setShowScheduleDetail(false);
                        setSelectedSchedule(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">勤務日</label>
                      <p className="text-gray-900">
                        {new Date(selectedSchedule.workDate).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">勤務時間</label>
                      <p className="text-gray-900">
                        {selectedSchedule.scheduledStartTime?.substring(11, 16)} ～ {selectedSchedule.scheduledEndTime?.substring(11, 16)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">休憩時間</label>
                      <p className="text-gray-900">{selectedSchedule.breakTimeMinutes}分</p>
                    </div>

                    {selectedSchedule.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedSchedule.notes}</p>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        💡 スケジュールの変更が必要な場合は、必ず電話でご連絡ください。
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        setShowScheduleDetail(false);
                        setSelectedSchedule(null);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{activeMenu}</h2>
            <p className="text-gray-600">この機能は開発中です。</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b lg:justify-start">
          <div>
            <h1 className="text-xl font-bold text-gray-800">薬局管理システム</h1>
            <p className="text-sm text-gray-600">{profile?.pharmacyName || '薬局名'}</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6 pb-20 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                  activeMenu === item.id 
                    ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' 
                    : 'text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${activeMenu === item.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-80 p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">設定</span>
            </div>
            <NotificationBell />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full hover:text-gray-800"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">ログアウト</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <div className="bg-white shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-gray-800">{activeMenu}</h1>
            <NotificationBell />
          </div>
        </div>
        
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}