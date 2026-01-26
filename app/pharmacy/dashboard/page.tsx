'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Calendar,
  Home
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
  getPharmacyProfile,
  updatePharmacyProfile,
  getPharmacyFees,
  proposeDates,
  sendFormalOffer,
  type WorkContract,
  type PharmacyProfile,
  type PlatformFee
} from '@/lib/api';
import type { JobPosting, JobApplication, MessageThread as APIMessageThread, Message } from '@/lib/api';

type ActiveMenu = 'ホーム' | '応募確認' | 'メッセージ' | '募集掲載' | '契約管理' | 'プロフィール管理' | 'プロフィール' | '費用管理';

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
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('ホーム');
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
    dailyRate: '25000', // 日給（固定2.5万円）
    workLocation: '',
    suggestedStartDate: '', // 勤務開始可能期間
    contractDurationDays: '30', // 希望勤務日数（10〜90日）
    requirements: '',
    applicationDeadline: '', // 募集期限（デフォルト7日後）
    preferredSchedule: '', // 希望勤務曜日・時間帯（任意）
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

  // Profile States
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PharmacyProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Platform Fee States
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<PlatformFee | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  // Structured Message States
  const [showDateProposalModal, setShowDateProposalModal] = useState(false);
  const [proposedDates, setProposedDates] = useState<string[]>(['', '', '']);
  const [showFormalOfferModal, setShowFormalOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    initialWorkDate: '',
    workDays: 30,
    totalCompensation: 750000,
    workHours: '9:00-18:00',
    platformFee: 50000,
    paymentDeadline: ''
  });

  const menuItems = [
    { id: 'ホーム' as ActiveMenu, label: 'ホーム', icon: Home },
    { id: '応募確認' as ActiveMenu, label: '薬剤師からの応募確認', icon: Users },
    { id: 'メッセージ' as ActiveMenu, label: 'メッセージ管理', icon: MessageSquare },
    { id: '募集掲載' as ActiveMenu, label: '薬局からの募集掲載', icon: FileText },
    { id: '契約管理' as ActiveMenu, label: '契約管理', icon: FileText },
    { id: '費用管理' as ActiveMenu, label: 'プラットフォーム手数料管理', icon: DollarSign },
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
        pharmacyId: profile?.id ? parseInt(profile.id) : 1, // Get from profile or use default
        title: jobFormData.title,
        description: jobFormData.description,
        employmentType: jobFormData.employmentType,
        dailyRate: jobFormData.dailyRate ? Number(jobFormData.dailyRate) : 25000,
        workLocation: jobFormData.workLocation,
        suggestedStartDate: jobFormData.suggestedStartDate || undefined,
        contractDurationDays: jobFormData.contractDurationDays ? Number(jobFormData.contractDurationDays) : 30,
        requirements: jobFormData.requirements,
        applicationDeadline: jobFormData.applicationDeadline || undefined,
        preferredSchedule: jobFormData.preferredSchedule || undefined,
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
        dailyRate: jobFormData.dailyRate ? Number(jobFormData.dailyRate) : 25000,
        workLocation: jobFormData.workLocation,
        suggestedStartDate: jobFormData.suggestedStartDate || undefined,
        contractDurationDays: jobFormData.contractDurationDays ? Number(jobFormData.contractDurationDays) : 30,
        requirements: jobFormData.requirements,
        applicationDeadline: jobFormData.applicationDeadline || undefined,
        preferredSchedule: jobFormData.preferredSchedule || undefined,
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

  const handleAcceptApplication = async (applicationId: number) => {
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

  const handleRejectApplication = async (applicationId: number, reason?: string) => {
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

  const handleSendJobOffer = async (applicationId: number) => {
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
    // デフォルト値：募集期限は今日から7日後
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    
    setJobFormData({
      title: '',
      description: '',
      employmentType: 'part_time',
      dailyRate: '25000', // 固定日給2.5万円
      workLocation: '',
      suggestedStartDate: '',
      contractDurationDays: '30', // デフォルト30日
      requirements: '',
      applicationDeadline: defaultDeadline.toISOString().split('T')[0],
      preferredSchedule: '',
    });
  };

  const openEditJobModal = (job: JobPosting) => {
    setEditingJob(job);
    // 追加項目が型定義に無い場合でも安全に扱う（unknown → narrow）
    const extras = job as unknown as Partial<{
      dailyRate: number | null;
      suggestedStartDate: string | null;
      contractDurationDays: number | null;
      preferredSchedule: string | null;
    }>;
    setJobFormData({
      title: job.title,
      description: job.description || '',
      employmentType: job.employmentType,
      dailyRate: extras.dailyRate?.toString() || '25000',
      workLocation: job.workLocation || '',
      suggestedStartDate: extras.suggestedStartDate
        ? new Date(extras.suggestedStartDate).toISOString().split('T')[0]
        : '',
      contractDurationDays: extras.contractDurationDays?.toString() || '30',
      requirements: job.requirements || '',
      applicationDeadline: job.applicationDeadline 
        ? new Date(job.applicationDeadline).toISOString().split('T')[0]
        : '',
      preferredSchedule: extras.preferredSchedule || '',
    });
    setShowJobModal(true);
  };

  // Sample data removed - using API data instead

  const employees: Employee[] = [
    { id: 1, name: '佐藤 太郎', position: '正社員', startDate: '2025-08-01', monthlyHours: 160, hourlyRate: 2500 },
    { id: 2, name: '鈴木 花音', position: 'パート', startDate: '2025-09-01', monthlyHours: 120, hourlyRate: 2200 }
  ];

  // ✅ ハードコードデータを削除: profileステートを使用

  // 手数料一覧を取得
  const fetchFees = async () => {
    setIsLoadingFees(true);
    try {
      const response = await getPharmacyFees();
      setFees(response.fees);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setIsLoadingFees(false);
    }
  };

  // 費用管理タブが選択されたら手数料を取得
  useEffect(() => {
    if (activeMenu === '費用管理') {
      fetchFees();
    }
  }, [activeMenu]);

  // 日付候補を提案
  const handleProposeDates = async () => {
    if (!selectedApplication) return;

    // 2週間後以降の日付のみ許可
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const validDates = proposedDates.filter(date => {
      if (!date) return false;
      const dateObj = new Date(date);
      return dateObj >= twoWeeksLater;
    });

    if (validDates.length === 0) {
      alert('2週間後以降の日付を最低1つ選択してください');
      return;
    }

    try {
      await proposeDates({
        applicationId: selectedApplication.id,
        proposedDates: validDates
      });
      alert('日付候補を送信しました');
      setShowDateProposalModal(false);
      setProposedDates(['', '', '']);
    } catch (err) {
      console.error('Failed to propose dates:', err);
      alert('日付候補の送信に失敗しました');
    }
  };

  // 正式オファーを送信
  const handleSendFormalOffer = async () => {
    if (!selectedApplication) return;

    if (!offerData.initialWorkDate || !offerData.paymentDeadline) {
      alert('初回出勤日と支払い期限を入力してください');
      return;
    }

    // 報酬と手数料を自動計算（日給2.5万円固定、手数料40%）
    const DAILY_RATE = 25000;
    const totalCompensation = DAILY_RATE * offerData.workDays;
    const platformFee = Math.floor(totalCompensation * 0.40);

    try {
      await sendFormalOffer({
        applicationId: selectedApplication.id,
        initialWorkDate: offerData.initialWorkDate,
        workDays: offerData.workDays,
        workHours: offerData.workHours,
        paymentDeadline: offerData.paymentDeadline
      });
      alert(`正式オファーを送信しました\n報酬総額: ${totalCompensation.toLocaleString()}円\nプラットフォーム手数料: ${platformFee.toLocaleString()}円`);
      setShowFormalOfferModal(false);
      // フォームをリセット
      setOfferData({
        initialWorkDate: '',
        workDays: 30,
        totalCompensation: 750000,
        workHours: '9:00-18:00',
        platformFee: 50000,
        paymentDeadline: ''
      });
    } catch (err) {
      console.error('Failed to send formal offer:', err);
      alert('正式オファーの送信に失敗しました');
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'ホーム':
        // ダミーデータ
        const activeJobsCount = jobPostings.filter(job => job.status === 'active').length || 5;
        const totalApplications = applications.length || 12;
        const activeWorkers = contracts.filter(c => c.status === 'active' && c.isActive).length || 3;
        const pendingContracts = contracts.filter(c => c.status === 'pending').length || 2;

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
              <div className="text-sm text-gray-500">
                最終更新: {new Date().toLocaleString('ja-JP')}
              </div>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 現在募集中の案件 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 opacity-80" />
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold mb-1">
                    {activeJobsCount}
                  </div>
                  <div className="text-lg font-medium opacity-90">件</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">現在募集中の案件</h3>
                <p className="text-blue-100 text-sm">アクティブな求人</p>
              </div>

              {/* 応募された薬剤師数 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 opacity-80" />
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold mb-1">
                    {totalApplications}
                  </div>
                  <div className="text-lg font-medium opacity-90">名</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">応募された薬剤師数</h3>
                <p className="text-blue-100 text-sm">総応募者数</p>
              </div>

              {/* 現在の稼働数 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <UserCheck className="w-8 h-8 opacity-80" />
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold mb-1">
                    {activeWorkers}
                  </div>
                  <div className="text-lg font-medium opacity-90">名</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">現在の稼働数</h3>
                <p className="text-blue-100 text-sm">アクティブな契約</p>
              </div>

              {/* 契約書確認 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 opacity-80" />
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold mb-1">
                    {pendingContracts}
                  </div>
                  <div className="text-lg font-medium opacity-90">件</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">契約書確認</h3>
                <p className="text-blue-100 text-sm">確認待ち</p>
              </div>
            </div>

            {/* 詳細セクション */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近の応募 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    最近の応募
                  </h3>
                  <button
                    onClick={() => setActiveMenu('応募確認')}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    すべて見る →
                  </button>
                </div>
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {app.pharmacist?.firstName} {app.pharmacist?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(app.appliedAt || '').toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status === 'pending' ? '新規' : app.status === 'accepted' ? '承認済み' : app.status}
                      </span>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>応募がありません</p>
                    </div>
                  )}
                </div>
              </div>

              {/* アクティブな求人 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    アクティブな求人
                  </h3>
                  <button
                    onClick={() => setActiveMenu('募集掲載')}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    すべて見る →
                  </button>
                </div>
                <div className="space-y-3">
                  {jobPostings.filter(job => job.status === 'active').slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-1">{job.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {job.currentApplicants || 0}名応募
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('ja-JP') : '期限なし'}
                          </span>
                        </div>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        募集中
                      </span>
                    </div>
                  ))}
                  {jobPostings.filter(job => job.status === 'active').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>アクティブな求人がありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">クイックアクション</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setShowJobModal(true);
                    setEditingJob(null);
                    resetJobForm();
                  }}
                  className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">新しい求人を投稿</span>
                </button>
                <button
                  onClick={() => setActiveMenu('応募確認')}
                  className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">応募を確認</span>
                </button>
                <button
                  onClick={() => setActiveMenu('契約管理')}
                  className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">契約を管理</span>
                </button>
              </div>
            </div>
          </div>
        );
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
                    {/* 基本情報 */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">
                        基本情報
                        {selectedApplication.status !== 'accepted' && (
                          <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            ⚠️ 個人情報は承認後に開示されます
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
                        {selectedApplication.pharmacist?.age && (
                          <p><span className="font-medium">年齢:</span> {selectedApplication.pharmacist.age}歳</p>
                        )}
                      </div>
                    </div>

                    {/* 学歴・資格情報 */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">学歴・資格</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        {selectedApplication.pharmacist?.university && (
                          <p><span className="font-medium">出身大学:</span> {selectedApplication.pharmacist.university}</p>
                        )}
                        {selectedApplication.pharmacist?.graduationYear && (
                          <p><span className="font-medium">卒業年:</span> {selectedApplication.pharmacist.graduationYear}年</p>
                        )}
                        {selectedApplication.pharmacist?.licenseAcquiredYear && (
                          <p><span className="font-medium">薬剤師免許取得年:</span> {selectedApplication.pharmacist.licenseAcquiredYear}年</p>
                        )}
                        {selectedApplication.pharmacist?.certifiedPharmacistQualifications && selectedApplication.pharmacist.certifiedPharmacistQualifications.length > 0 && (
                          <p><span className="font-medium">認定薬剤師資格:</span> {selectedApplication.pharmacist.certifiedPharmacistQualifications.join('、')}</p>
                        )}
                        {selectedApplication.pharmacist?.otherQualifications && selectedApplication.pharmacist.otherQualifications.length > 0 && (
                          <p><span className="font-medium">その他の資格:</span> {selectedApplication.pharmacist.otherQualifications.join('、')}</p>
                        )}
                      </div>
                    </div>

                    {/* 経歴・経験 */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">経歴・経験</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        {selectedApplication.pharmacist?.workExperienceMonths ? (
                          <p>
                            <span className="font-medium">勤務歴:</span> 
                            {` ${Math.floor(selectedApplication.pharmacist.workExperienceMonths / 12)}年${selectedApplication.pharmacist.workExperienceMonths % 12}ヶ月`}
                          </p>
                        ) : selectedApplication.pharmacist?.experienceYears ? (
                          <p><span className="font-medium">実務経験年数:</span> {selectedApplication.pharmacist.experienceYears}年</p>
                        ) : null}
                        {selectedApplication.pharmacist?.workExperienceTypes && selectedApplication.pharmacist.workExperienceTypes.length > 0 && (
                          <p><span className="font-medium">勤務経験のある業態:</span> {selectedApplication.pharmacist.workExperienceTypes.join('、')}</p>
                        )}
                        {selectedApplication.pharmacist?.mainJobExperiences && selectedApplication.pharmacist.mainJobExperiences.length > 0 && (
                          <p><span className="font-medium">主な業務経験:</span> {selectedApplication.pharmacist.mainJobExperiences.join('、')}</p>
                        )}
                        <p><span className="font-medium">運転免許:</span> {selectedApplication.pharmacist?.hasDriversLicense ? 'あり' : 'なし'}</p>
                        <p><span className="font-medium">在宅経験:</span> {selectedApplication.pharmacist?.hasHomeCareExperience ? 'あり' : 'なし'}</p>
                      </div>
                    </div>

                    {/* 専門分野・スキル */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">専門分野・スキル</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        {selectedApplication.pharmacist?.specialtyFields && selectedApplication.pharmacist.specialtyFields.length > 0 && (
                          <p><span className="font-medium">得意な診療科・疾患領域:</span> {selectedApplication.pharmacist.specialtyFields.join('、')}</p>
                        )}
                        {selectedApplication.pharmacist?.specialties && selectedApplication.pharmacist.specialties.length > 0 && (
                          <p><span className="font-medium">専門分野:</span> {selectedApplication.pharmacist.specialties.join('、')}</p>
                        )}
                        {selectedApplication.pharmacist?.pharmacySystemsExperience && selectedApplication.pharmacist.pharmacySystemsExperience.length > 0 && (
                          <p><span className="font-medium">使用経験のある薬歴システム:</span> {selectedApplication.pharmacist.pharmacySystemsExperience.join('、')}</p>
                        )}
                      </div>
                    </div>

                    {/* 特記事項 */}
                    {selectedApplication.pharmacist?.specialNotes && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">特記事項</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedApplication.pharmacist.specialNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* 自己紹介・PR */}
                    {(selectedApplication.pharmacist?.selfIntroduction || selectedApplication.pharmacist?.bio) && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 border-b pb-2">自己紹介・PR</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedApplication.pharmacist?.selfIntroduction || selectedApplication.pharmacist?.bio}</p>
                        </div>
                      </div>
                    )}
                    
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
                    ) : selectedApplication.status === 'accepted' ? (
                      <>
                        <button 
                          onClick={() => {
                            setShowDateProposalModal(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          📅 初回出勤日の候補を提案
                        </button>
                        <button 
                          onClick={() => {
                            // デフォルト値を設定
                            const threeDaysBeforeStart = new Date();
                            threeDaysBeforeStart.setDate(threeDaysBeforeStart.getDate() + 17);
                            setOfferData({
                              ...offerData,
                              paymentDeadline: threeDaysBeforeStart.toISOString().split('T')[0]
                            });
                            setShowFormalOfferModal(true);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          📝 正式オファーを送信
                        </button>
                        <button 
                          onClick={() => setSelectedApplication(null)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                        >
                          閉じる
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

            {/* 日付候補提案モーダル */}
            {showDateProposalModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">初回出勤日の候補を提案</h3>
                    <button 
                      onClick={() => setShowDateProposalModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      薬剤師に複数の候補日を提案してください（最大3つ）
                    </p>
                    
                    {proposedDates.map((date, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          候補日 {index + 1}
                        </label>
                        <input 
                          type="date"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...proposedDates];
                            newDates[index] = e.target.value;
                            setProposedDates(newDates);
                          }}
                          min={(() => {
                            const twoWeeksLater = new Date();
                            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
                            return twoWeeksLater.toISOString().split('T')[0];
                          })()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs text-orange-800">
                        ⚠️ 2週間後以降の日付のみ選択可能です
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      onClick={() => setShowDateProposalModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      キャンセル
                    </button>
                    <button 
                      onClick={handleProposeDates}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      送信する
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 正式オファー送信モーダル */}
            {showFormalOfferModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">正式オファーを送信</h3>
                    <button 
                      onClick={() => setShowFormalOfferModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        初回出勤日 <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date"
                        value={offerData.initialWorkDate}
                        onChange={(e) => setOfferData({...offerData, initialWorkDate: e.target.value})}
                        min={(() => {
                          const twoWeeksLater = new Date();
                          twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
                          return twoWeeksLater.toISOString().split('T')[0];
                        })()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        勤務日数 <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        value={offerData.workDays}
                        onChange={(e) => setOfferData({...offerData, workDays: parseInt(e.target.value) || 10})}
                        min="10"
                        max="90"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        10〜90日の範囲で入力してください
                      </p>
                    </div>
                    
                    {/* 報酬総額の自動計算表示 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">日給（固定）:</span>
                          <span className="text-sm font-semibold text-gray-900">¥25,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">勤務日数:</span>
                          <span className="text-sm font-semibold text-gray-900">{offerData.workDays}日</span>
                        </div>
                        <div className="border-t border-blue-300 my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium text-gray-800">報酬総額:</span>
                          <span className="text-lg font-bold text-blue-600">
                            ¥{(offerData.workDays * 25000).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">プラットフォーム手数料（40%）:</span>
                          <span className="text-sm font-semibold text-orange-600">
                            ¥{Math.floor(offerData.workDays * 25000 * 0.40).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-blue-800">
                        💡 報酬は体験期間終了後に薬剤師へ直接お支払いください
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        勤務時間（目安）
                      </label>
                      <input 
                        type="text"
                        value={offerData.workHours}
                        onChange={(e) => setOfferData({...offerData, workHours: e.target.value})}
                        placeholder="9:00-18:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        詳細なスケジュールは薬剤師と直接調整してください
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        手数料支払い期限 <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date"
                        value={offerData.paymentDeadline}
                        onChange={(e) => setOfferData({...offerData, paymentDeadline: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ 初回出勤日の3日前までに設定してください
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        <strong>重要:</strong> 手数料のお支払い確認後、薬剤師の連絡先が開示されます。期限内にお支払いください。
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      onClick={() => setShowFormalOfferModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      キャンセル
                    </button>
                    <button 
                      onClick={handleSendFormalOffer}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      オファーを送信
                    </button>
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
                                <div className="space-y-3">
                                  {/* 初回出勤日の提案とオファー機能は今後実装予定 */}
                                  <div className="bg-blue-50 p-4 rounded-lg text-center text-gray-600">
                                    メッセージでやり取りをしてください
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 rounded border">
                                  <p>💡 まず候補日を提案し、薬剤師が選択後に正式オファーを送信してください。</p>
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
                      const hasWorkNotice = contract.status === 'active' && contract.terms;
                      
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
                            {hasWorkNotice && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                📋 通知書あり
                              </span>
                            )}
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
                      {/* 契約基本情報 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">契約基本情報</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">薬剤師名</p>
                            <p className="text-sm font-medium text-gray-900">
                            {selectedContract.pharmacist?.lastName} {selectedContract.pharmacist?.firstName}
                          </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">契約ステータス</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedContract.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedContract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              selectedContract.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedContract.status === 'active' ? '契約中' :
                               selectedContract.status === 'pending' ? '承諾待ち' :
                               selectedContract.status === 'rejected' ? '辞退' :
                               selectedContract.status}
                            </span>
                          </div>
                          {selectedContract.application?.jobPosting?.title && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">求人タイトル</p>
                              <p className="text-sm text-gray-900">{selectedContract.application.jobPosting.title}</p>
                            </div>
                          )}
                          {selectedContract.contractStartDate && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">契約開始日</p>
                              <p className="text-sm text-gray-900">
                                {new Date(selectedContract.contractStartDate).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          )}
                          {selectedContract.contractEndDate && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">契約終了日</p>
                              <p className="text-sm text-gray-900">
                                {new Date(selectedContract.contractEndDate).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          )}
                          {selectedContract.offerSentAt && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">オファー送信日</p>
                              <p className="text-sm text-gray-900">
                                {new Date(selectedContract.offerSentAt).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          )}
                          {selectedContract.acceptedAt && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">承諾日</p>
                              <p className="text-sm text-gray-900">
                                {new Date(selectedContract.acceptedAt).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedContract.status === 'active' && selectedContract.terms && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-700">📋 労働条件通知書</h4>
                            <div className="flex space-x-2">
                              {selectedContract.workNoticeUrl ? (
                                <>
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${selectedContract.workNoticeUrl}`}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>PDF ダウンロード</span>
                                  </a>
                                  <button
                                    onClick={() => {
                                      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${selectedContract.workNoticeUrl}`, '_blank');
                                    }}
                                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>PDFを開く</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      const blob = new Blob([selectedContract.terms || ''], { type: 'text/plain;charset=utf-8' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `労働条件通知書_${selectedContract.pharmacist?.lastName}${selectedContract.pharmacist?.firstName}_${new Date().toISOString().split('T')[0]}.txt`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>テキストでダウンロード</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html>
                                            <head>
                                              <title>労働条件通知書</title>
                                              <style>
                                                body { font-family: 'MS Gothic', monospace; padding: 20mm; white-space: pre-wrap; }
                                                @media print { body { padding: 0; } }
                                              </style>
                                            </head>
                                            <body>${selectedContract.terms}</body>
                                          </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                          printWindow.print();
                                        }, 250);
                                      }
                                    }}
                                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    <span>印刷</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
                            <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 leading-relaxed">
                            {selectedContract.terms}
                          </pre>
                          </div>
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                              💡 この労働条件通知書は契約成立時に自動生成されました。ダウンロードまたは印刷してご活用ください。
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedContract.status === 'pending' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">薬剤師の承諾待ちです</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>薬剤師が契約を承諾すると、労働条件通知書が自動生成され、両者で確認できるようになります。</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedContract.status === 'rejected' && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">この契約は薬剤師により辞退されました</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>別の薬剤師を検討するか、募集条件を見直してください。</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedContract.status === 'active' && (
                        <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">契約が成立しています</h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>労働条件通知書が発行されています。薬剤師とメッセージで勤務開始の詳細を調整してください。</p>
                              </div>
                            </div>
                          </div>
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
                    {/* 必須項目 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">必須項目</h4>
                      
                      {/* 1. 求人タイトル */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        求人タイトル <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={jobFormData.title}
                        onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="例：短期勤務の薬剤師を募集します"
                        required
                      />
                    </div>

                      {/* 2. 求人詳細 */}
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

                      {/* 3. 勤務地 */}
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

                      {/* 4. 希望勤務日数 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          希望勤務日数 <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="number"
                            value={jobFormData.contractDurationDays}
                            onChange={(e) => setJobFormData({...jobFormData, contractDurationDays: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="30"
                          min="10"
                          max="90"
                            required
                          />
                        <p className="text-xs text-gray-500 mt-1">10日〜90日（3ヶ月）の範囲で入力してください</p>
                        {jobFormData.contractDurationDays && Number(jobFormData.contractDurationDays) >= 10 && Number(jobFormData.contractDurationDays) <= 90 && (
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            報酬総額：{(Number(jobFormData.contractDurationDays) * 2.5).toFixed(1)}万円（日給2.5万円 × {jobFormData.contractDurationDays}日）
                          </p>
                        )}
                      </div>

                      {/* 5. 勤務開始可能期間 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          勤務開始可能期間 <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="date"
                          value={jobFormData.suggestedStartDate}
                          onChange={(e) => setJobFormData({...jobFormData, suggestedStartDate: e.target.value})}
                          min={(() => {
                            const twoWeeksLater = new Date();
                            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
                            return twoWeeksLater.toISOString().split('T')[0];
                          })()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>この日から2週間の間で初回勤務日を相談</strong>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          💡 薬剤師と相談の上、初回勤務日を決定します
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          ※ 今日から2週間後以降の日付を選択してください
                        </p>
                    </div>

                      {/* 6. 募集期限 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          募集期限 <span className="text-red-500">*</span>
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
                        <p className="text-xs text-gray-500 mt-1">デフォルト：今日から7日後（最短3日後、最長14日後）</p>
                    </div>

                      {/* 7. 応募条件・資格 */}
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
                    </div>

                    {/* 任意項目 */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">任意項目（参考情報）</h4>
                      
                      {/* 8. 希望勤務曜日・時間帯 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          希望勤務曜日・時間帯
                      </label>
                      <textarea 
                          value={jobFormData.preferredSchedule}
                          onChange={(e) => setJobFormData({...jobFormData, preferredSchedule: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                          placeholder="例：火・木・金の午前中希望、平日9:00-18:00など"
                      />
                        <p className="text-xs text-gray-500 mt-1">※あくまで希望です。実際の勤務日時は薬剤師と相談の上決定します</p>
                      </div>
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

      case '費用管理':
        const feeStatusMap: Record<string, string> = {
          'pending': '支払い待ち',
          'paid': '支払い済み',
          'overdue': '支払い期限超過',
          'cancelled': 'キャンセル'
        };

        const feeStatusColorMap: Record<string, string> = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'paid': 'bg-green-100 text-green-800',
          'overdue': 'bg-red-100 text-red-800',
          'cancelled': 'bg-gray-100 text-gray-800'
        };

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">プラットフォーム手数料管理</h2>
            </div>

            {isLoadingFees ? (
              <div className="text-center py-12">
                <p className="text-gray-600">読み込み中...</p>
            </div>
            ) : fees.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">手数料はありません</h3>
                <p className="text-gray-600">採用が確定すると、手数料が表示されます。</p>
                </div>
              ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        契約ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        薬剤師
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        求人タイトル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        手数料金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        支払い期限
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fees.map((fee) => (
                      <tr key={fee.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.contractId.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.workContracts?.pharmacistProfiles 
                            ? `${fee.workContracts.pharmacistProfiles.lastName} ${fee.workContracts.pharmacistProfiles.firstName}`
                            : '未設定'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.workContracts?.jobPostings?.title || '未設定'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ¥{fee.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(fee.paymentDeadline).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            feeStatusColorMap[fee.status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {feeStatusMap[fee.status] || fee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedFee(fee)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                </div>
              )}

            {/* 注意事項 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 font-semibold mb-2">💡 プラットフォーム手数料について</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                <li>• 手数料は初回出勤日の3日前までにお支払いください</li>
                <li>• 支払い確認後、薬剤師の個人情報（氏名、電話番号、メールアドレス）が開示されます</li>
                <li>• 支払い方法については、運営から別途ご連絡いたします</li>
              </ul>
            </div>

            {/* 手数料詳細モーダル */}
            {selectedFee && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">手数料詳細</h3>
                    <button
                      onClick={() => setSelectedFee(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">基本情報</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">手数料ID:</span> {selectedFee.id}</p>
                        <p><span className="font-medium">契約ID:</span> {selectedFee.contractId}</p>
                        <p><span className="font-medium">金額:</span> ¥{selectedFee.amount.toLocaleString()}</p>
                        <p><span className="font-medium">ステータス:</span> 
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            feeStatusColorMap[selectedFee.status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {feeStatusMap[selectedFee.status] || selectedFee.status}
                          </span>
                        </p>
                        <p><span className="font-medium">支払い期限:</span> {new Date(selectedFee.paymentDeadline).toLocaleDateString('ja-JP')}</p>
                        {selectedFee.paidAt && (
                          <p><span className="font-medium">支払い日:</span> {new Date(selectedFee.paidAt).toLocaleDateString('ja-JP')}</p>
                        )}
                      </div>
                    </div>

                    {selectedFee.workContracts && (
                    <div>
                        <h4 className="font-medium text-gray-800 mb-2">契約情報</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          {selectedFee.workContracts.pharmacistProfiles && (
                            <p><span className="font-medium">薬剤師:</span> 
                              {` ${selectedFee.workContracts.pharmacistProfiles.lastName} ${selectedFee.workContracts.pharmacistProfiles.firstName}`}
                            </p>
                          )}
                          {selectedFee.workContracts.jobPostings && (
                            <p><span className="font-medium">求人:</span> {selectedFee.workContracts.jobPostings.title}</p>
                          )}
                          {selectedFee.workContracts.initialWorkDate && (
                            <p><span className="font-medium">初回出勤日:</span> {new Date(selectedFee.workContracts.initialWorkDate).toLocaleDateString('ja-JP')}</p>
                          )}
                          {selectedFee.workContracts.workDays && (
                            <p><span className="font-medium">勤務日数:</span> {selectedFee.workContracts.workDays}日</p>
                          )}
                          {selectedFee.workContracts.totalCompensation && (
                            <p><span className="font-medium">報酬総額:</span> ¥{selectedFee.workContracts.totalCompensation.toLocaleString()}</p>
                          )}
                    </div>
                      </div>
                    )}

                    {/* 請求書ダウンロード */}
                    {selectedFee.invoiceUrl && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">📄 請求書</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">プラットフォーム手数料請求書</p>
                              <p className="text-xs text-gray-500">PDF形式でダウンロードできます</p>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedFee.invoiceUrl}`}
                                download
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center space-x-2"
                              >
                                <FileText className="w-4 h-4" />
                                <span>ダウンロード</span>
                              </a>
                              <button
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedFee.invoiceUrl}`, '_blank')}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center space-x-2"
                              >
                                <Eye className="w-4 h-4" />
                                <span>プレビュー</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 重要事項 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-yellow-900 font-semibold mb-2">⚠️ 重要事項</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• 支払い期限までにお支払いがない場合、契約は自動キャンセルされます</li>
                        <li>• 支払い確認後、薬剤師の個人情報（氏名・電話番号・メールアドレス）が開示されます</li>
                        <li>• 薬剤師への報酬は体験期間終了後に直接お支払いください</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    {selectedFee.invoiceUrl && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedFee.invoiceUrl}`}
                        download
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        請求書をダウンロード
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedFee(null)}
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