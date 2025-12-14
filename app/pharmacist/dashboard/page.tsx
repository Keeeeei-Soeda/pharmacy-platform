'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  Search, 
  FileText, 
  Clock, 
  Settings,
  Bell,
  LogOut,
  MapPin,
  DollarSign,
  Calendar as CalendarIcon,
  Building,
  User,
  Send,
  Eye,
  Heart,
  MessageSquare,
  Menu,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { 
  getJobs, 
  applyToJob, 
  getMyApplications, 
  getMyThreads,
  getMessagesByThread,
  sendMessage,
  getUnreadCount,
  markAsRead,
  logout,
  getPharmacistContracts,
  acceptJobOffer,
  rejectJobOffer,
  getPharmacistSchedules,
  uploadLicense,
  getLicenseInfo,
  deleteLicense,
  getPharmacistProfile,
  updatePharmacistProfile,
  type WorkSchedule,
  type WorkContract,
  type LicenseInfo,
  type PharmacistProfile
} from '@/lib/api';
import imageCompression from 'browser-image-compression';
import type { JobPosting, JobApplication, MessageThread as APIMessageThread, Message } from '@/lib/api';

type ActiveMenu = '募集検索' | 'メッセージ' | '勤務中薬局' | '出勤予定' | 'プロフィール';

interface WorkingPharmacy {
  id: number;
  name: string;
  startDate: string;
  workDays: string[];
  timeSlot: string;
  hourlyRate: number;
  totalHours: number;
  status: string;
}

export default function PharmacistDashboard() {
  const router = useRouter();
  
  // localStorageから前回のタブを復元（初回は'募集検索'）
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(() => {
    if (typeof window !== 'undefined') {
      const savedMenu = localStorage.getItem('pharmacist_active_menu');
      if (savedMenu && ['募集検索', 'メッセージ', '勤務中薬局', '出勤予定', 'プロフィール'].includes(savedMenu)) {
        return savedMenu as ActiveMenu;
      }
    }
    return '募集検索';
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  
  // API Data States
  const [jobListings, setJobListings] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search/Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  
  // Application Modal State
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationCoverLetter, setApplicationCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  
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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<WorkContract | null>(null);

  // Schedule States
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  // Upload States
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingRegistration, setIsUploadingRegistration] = useState(false);

  // Profile States
  const [profile, setProfile] = useState<PharmacistProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PharmacistProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const menuItems = [
    { id: '募集検索' as ActiveMenu, label: '薬局募集への応募', icon: Search },
    { id: 'メッセージ' as ActiveMenu, label: 'メッセージ', icon: Send },
    { id: '勤務中薬局' as ActiveMenu, label: '勤務中の薬局', icon: Building },
    { id: '出勤予定' as ActiveMenu, label: '出勤予定カレンダー', icon: CalendarIcon },
    { id: 'プロフィール' as ActiveMenu, label: 'プロフィール', icon: User }
  ];

  // activeMenuが変更されたらlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pharmacist_active_menu', activeMenu);
    }
  }, [activeMenu]);

  // Fetch job listings and applications on mount
  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
    fetchMessageThreads();
    fetchUnreadCount();
    fetchContracts();
  }, []);

  // Check for pending offers
  useEffect(() => {
    const pending = contracts.find(c => c.status === 'pending');
    if (pending && !showOfferModal && !pendingOffer) {
      setPendingOffer(pending);
      setShowOfferModal(true);
    }
  }, [contracts, showOfferModal, pendingOffer]);

  // Fetch messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread]);

  // Fetch schedules when '出勤予定' tab is selected
  useEffect(() => {
    if (activeMenu === '出勤予定') {
      fetchSchedules();
    }
  }, [activeMenu]);

  // Fetch license info and profile when 'プロフィール' tab is selected
  useEffect(() => {
    if (activeMenu === 'プロフィール') {
      fetchLicenseInfo();
      fetchProfile();
    }
  }, [activeMenu]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs({ 
        searchQuery: searchQuery || undefined,
        prefecture: selectedPrefecture || undefined
      });
      setJobListings(response.jobs);
      setError('');
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('求人の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await getMyApplications();
      setMyApplications(response.applications);
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

  const handleSearch = () => {
    fetchJobs();
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    
    setIsApplying(true);
    try {
      await applyToJob({
        jobPostingId: selectedJob.id,
        coverLetter: applicationCoverLetter || undefined
      });
      
      alert('応募が完了しました！');
      setShowApplicationModal(false);
      setApplicationCoverLetter('');
      setSelectedJob(null);
      
      // Refresh applications list
      fetchMyApplications();
      fetchJobs();
    } catch (err) {
      console.error('Application failed:', err);
      alert('応募に失敗しました。もう一度お試しください。');
    } finally {
      setIsApplying(false);
    }
  };

  // Contract functions
  const fetchContracts = async () => {
    try {
      const response = await getPharmacistContracts();
      setContracts(response.contracts || []);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setContracts([]); // エラー時は空配列を設定
    }
  };

  // スケジュール取得（薬剤師用：全契約のスケジュールを取得）
  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const scheduleData = await getPharmacistSchedules();
      setSchedules(scheduleData || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // 証明書情報取得
  const fetchLicenseInfo = async () => {
    try {
      const info = await getLicenseInfo();
      setLicenseInfo(info);
    } catch (err) {
      console.error('Failed to fetch license info:', err);
    }
  };

  // プロフィール情報取得
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getPharmacistProfile();
      setProfile(data.profile);
      setProfileForm(data.profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, []);

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
      await updatePharmacistProfile(profileForm);
      // 保存後にプロフィールを再取得して最新のデータを表示
      await fetchProfile();
      setIsEditingProfile(false);
      alert('プロフィールを更新しました');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 画像圧縮とアップロード
  const handleFileUpload = async (file: File, type: 'license' | 'registration') => {
    if (type === 'license') {
      setIsUploadingLicense(true);
    } else {
      setIsUploadingRegistration(true);
    }

    try {
      // 画像ファイルの場合は圧縮
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1, // 最大1MBに圧縮
          maxWidthOrHeight: 1920, // 最大サイズ
          useWebWorker: true,
          fileType: file.type
        };
        
        fileToUpload = await imageCompression(file, options);
        console.log('Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('Compressed size:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
      }

      // アップロード
      await uploadLicense(fileToUpload, type);
      alert('証明書をアップロードしました！');
      
      // 証明書情報を再取得
      fetchLicenseInfo();

    } catch (err) {
      console.error('Upload error:', err);
      alert('アップロードに失敗しました');
    } finally {
      if (type === 'license') {
        setIsUploadingLicense(false);
      } else {
        setIsUploadingRegistration(false);
      }
    }
  };

  // 証明書削除
  const handleDeleteLicense = async (type: 'license' | 'registration') => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      await deleteLicense(type);
      alert('証明書を削除しました');
      fetchLicenseInfo();
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました');
    }
  };

  const handleAcceptOffer = async (contractId: string) => {
    if (!confirm('この採用オファーを承諾しますか？承諾すると労働条件通知書が発行されます。')) return;
    
    try {
      const response = await acceptJobOffer(contractId);
      alert('採用オファーを承諾しました！労働条件通知書が発行されました。');
      setShowOfferModal(false);
      setPendingOffer(null);
      fetchContracts();
      
      // Show work notice
      if (response.workNotice) {
        console.log('Work Notice:', response.workNotice);
      }
    } catch (err) {
      console.error('Failed to accept offer:', err);
      alert('承諾に失敗しました');
    }
  };

  const handleRejectOffer = async (contractId: string) => {
    const reason = prompt('辞退理由を入力してください（任意）:');
    if (reason === null) return; // User cancelled
    
    if (!confirm('本当にこの採用オファーを辞退しますか？辞退すると薬局とのメッセージも非表示になります。')) return;
    
    try {
      await rejectJobOffer(contractId, reason || undefined);
      alert('採用オファーを辞退しました');
      setShowOfferModal(false);
      setPendingOffer(null);
      fetchContracts();
      fetchMessageThreads(); // Refresh messages as thread will be hidden
    } catch (err) {
      console.error('Failed to reject offer:', err);
      alert('辞退に失敗しました');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Check if job is already applied
  const isJobApplied = (jobId: string) => {
    return myApplications.some(app => app.jobPostingId === jobId);
  };

  // 契約データから「勤務中の薬局」を生成（status === 'active' の契約のみ）
  const workingPharmacies: WorkingPharmacy[] = contracts
    .filter(contract => contract.status === 'active')
    .map(contract => ({
      id: parseInt(contract.id) || 0,
      name: contract.pharmacy?.pharmacyName || '薬局名未設定',
      startDate: contract.contractStartDate ? new Date(contract.contractStartDate).toISOString().split('T')[0] : '未定',
      workDays: contract.workDays || [],
      timeSlot: contract.workHoursStart && contract.workHoursEnd 
        ? `${contract.workHoursStart} - ${contract.workHoursEnd}`
        : '未定',
      hourlyRate: contract.hourlyRate || 0,
      totalHours: 0, // TODO: 実際の勤務時間データから算出
      status: '勤務中'
    }));

  const renderContent = () => {
    switch (activeMenu) {
      case '募集検索':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-gray-800">薬局募集への応募</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="薬局名や地域で検索..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={selectedPrefecture}
                  onChange={(e) => setSelectedPrefecture(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">都道府県を選択</option>
                  <option value="北海道">北海道</option>
                  <option value="東京都">東京都</option>
                  <option value="大阪府">大阪府</option>
                  <option value="愛知県">愛知県</option>
                  <option value="福岡県">福岡県</option>
                  {/* Add more prefectures as needed */}
                </select>
                <button 
                  onClick={handleSearch}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg whitespace-nowrap"
                >
                  <Search className="w-5 h-5 inline mr-2" />
                  検索
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            <div className="grid gap-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">求人を読み込んでいます...</p>
                </div>
              ) : jobListings.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">求人が見つかりませんでした</h3>
                  <p className="text-gray-600">条件を変更して再検索してください</p>
                </div>
              ) : (
                jobListings.map((job) => {
                  const isApplied = isJobApplied(job.id);
                  const hourlyRate = job.minHourlyRate && job.maxHourlyRate 
                    ? `¥${job.minHourlyRate.toLocaleString()} - ¥${job.maxHourlyRate.toLocaleString()}`
                    : job.minHourlyRate 
                    ? `¥${job.minHourlyRate.toLocaleString()}`
                    : '応相談';
                  
                  const employmentTypeMap: Record<string, string> = {
                    'full_time': '正社員',
                    'part_time': 'パート',
                    'temporary': '短期',
                    'contract': '契約社員'
                  };
                  
                  const location = job.pharmacy?.city && job.pharmacy?.prefecture
                    ? `${job.pharmacy.prefecture}${job.pharmacy.city}`
                    : job.pharmacy?.prefecture || job.workLocation || '場所未定';

                  return (
                    <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-800">
                              {job.pharmacy?.pharmacyName || '薬局名未設定'}
                            </h3>
                            {isApplied && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">応募済み</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{hourlyRate}/時</span>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {employmentTypeMap[job.employmentType] || job.employmentType}
                            </span>
                            {job.status !== 'active' && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {job.status}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-2">{job.description || '詳細な説明はありません'}</p>
                          <p className="text-sm text-gray-500">
                            応募条件: {job.requirements || '特に指定なし'}
                          </p>
                        </div>
                        
                        <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                          <button 
                            onClick={() => setSelectedJob(job)}
                            className="text-gray-600 hover:text-gray-800 p-2"
                            title="詳細を見る"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="text-red-500 hover:text-red-700 p-2" title="お気に入り">
                            <Heart className="w-5 h-5" />
                          </button>
                          {!isApplied && job.status === 'active' ? (
                            <button 
                              onClick={() => {
                                setSelectedJob(job);
                                setShowApplicationModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1 whitespace-nowrap"
                            >
                              <Send className="w-4 h-4" />
                              <span>応募する</span>
                            </button>
                          ) : isApplied ? (
                            <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">
                              応募済み
                            </button>
                          ) : (
                            <button className="bg-gray-400 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed" disabled>
                              募集終了
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Application Modal */}
            {showApplicationModal && selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">応募確認</h3>
                    <button 
                      onClick={() => {
                        setShowApplicationModal(false);
                        setApplicationCoverLetter('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">応募先</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium">{selectedJob.pharmacy?.pharmacyName || '薬局名未設定'}</h5>
                      <p className="text-sm text-gray-600">{selectedJob.title}</p>
                      <p className="text-sm text-gray-600">
                        {selectedJob.pharmacy?.city && selectedJob.pharmacy?.prefecture
                          ? `${selectedJob.pharmacy.prefecture}${selectedJob.pharmacy.city}`
                          : selectedJob.workLocation || '場所未定'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">自己PR・志望動機（任意）</h4>
                    <textarea
                      value={applicationCoverLetter}
                      onChange={(e) => setApplicationCoverLetter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="あなたの経験やスキル、志望動機などをご記入ください..."
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">利用規約</h4>
                    <div className="bg-gray-50 p-4 rounded-lg h-40 overflow-y-auto text-sm text-gray-700">
                      <h5 className="font-medium mb-2">第1条（利用について）</h5>
                      <p className="mb-3">本サービスを利用する際は、以下の規約に同意していただく必要があります。</p>
                      
                      <h5 className="font-medium mb-2">第2条（応募について）</h5>
                      <p className="mb-3">応募後は薬局からの連絡をお待ちください。虚偽の情報での応募は禁止いたします。</p>
                      
                      <h5 className="font-medium mb-2">第3条（個人情報について）</h5>
                      <p className="mb-3">応募時に入力した情報は、マッチングのために薬局に開示されます。</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => {
                        setShowApplicationModal(false);
                        setApplicationCoverLetter('');
                      }}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800"
                      disabled={isApplying}
                    >
                      キャンセル
                    </button>
                    <button 
                      onClick={handleApply}
                      disabled={isApplying}
                      className={`px-6 py-2 rounded-lg text-white ${
                        isApplying
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          応募中...
                        </>
                      ) : (
                        '応募する'
                      )}
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
              <h2 className="text-2xl font-bold text-gray-800">メッセージ</h2>
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
                <p className="text-gray-600">応募が承認されると、薬局とメッセージができます</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Message List */}
                <div className="bg-white rounded-lg shadow max-h-[600px] overflow-hidden flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">メッセージ一覧</h3>
                  </div>
                  <div className="divide-y divide-gray-200 overflow-y-auto">
                    {acceptedThreads.map((thread) => {
                      const lastMsg = thread.messages?.[0];
                      const threadUnread = thread._count?.messages || 0;
                      
                      return (
                        <div 
                          key={thread.id} 
                          onClick={() => setSelectedThread(thread)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">
                              {thread.application?.jobPosting?.pharmacy?.pharmacyName || '薬局名未設定'}
                            </h4>
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

                {/* Message Detail */}
                {selectedThread ? (
                  <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col max-h-[600px]">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">
                        {selectedThread.application?.jobPosting?.pharmacy?.pharmacyName || '薬局名未設定'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedThread.application?.jobPosting?.title}
                      </p>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          メッセージはまだありません。最初のメッセージを送信しましょう！
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isMyMessage = message.sender.userType === 'pharmacist';
                          
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
                    
                    <div className="p-4 border-t">
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
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2 bg-white rounded-lg shadow flex items-center justify-center">
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

      case '勤務中薬局':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">勤務中の薬局</h2>
              <div className="text-sm text-gray-600">
                現在勤務中：{workingPharmacies.length}件
              </div>
            </div>

            {workingPharmacies.length > 0 ? (
              <div className="grid gap-6">
                {contracts.filter(c => c.status === 'active').map((contract) => (
                  <div key={contract.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {contract.pharmacy?.pharmacyName || '薬局名未設定'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {contract.pharmacy?.prefecture} {contract.pharmacy?.city}
                        </p>
                        <p className="text-gray-600 mt-1">
                          勤務開始日: {contract.contractStartDate 
                            ? new Date(contract.contractStartDate).toLocaleDateString('ja-JP')
                            : '未定'}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm self-start">
                        勤務中
                      </span>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">勤務条件</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>勤務曜日: {contract.workDays?.join('、') || '未定'}</p>
                          <p>勤務時間: {contract.workHoursStart && contract.workHoursEnd 
                            ? `${contract.workHoursStart} - ${contract.workHoursEnd}`
                            : '未定'}</p>
                          <p>時給: {contract.hourlyRate 
                            ? `¥${contract.hourlyRate.toLocaleString()}`
                            : '未定'}</p>
                          <p>休憩時間: {contract.breakTimeMinutes 
                            ? `${contract.breakTimeMinutes}分`
                            : '未定'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">契約情報</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">求人タイトル</span>
                              <span className="font-medium text-right">
                                {contract.application?.jobPosting?.title || '情報なし'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">契約ID</span>
                              <span className="font-mono text-xs text-gray-500">
                                {contract.id.substring(0, 8)}...
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">契約日</span>
                              <span className="font-medium">
                                {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => {
                          setActiveMenu('出勤予定');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span>出勤予定を確認</span>
                      </button>
                      <button 
                        onClick={() => {
                          // メッセージスレッドを検索して選択
                          const thread = messageThreads.find(
                            t => t.application?.id === contract.applicationId
                          );
                          if (thread) {
                            setSelectedThread(thread);
                            setActiveMenu('メッセージ');
                          } else {
                            alert('この契約に関連するメッセージスレッドが見つかりませんでした');
                          }
                        }}
                        className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>薬局とメッセージ</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowContractDetail(true);
                        }}
                        className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>契約詳細</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">勤務中の薬局がありません</h3>
                <p className="text-gray-600 mb-4">応募後、「働き始める」を押すとこちらに表示されます</p>
                <button 
                  onClick={() => setActiveMenu('募集検索')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  求人を探す
                </button>
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
                          <h4 className="font-medium text-gray-700 mb-2">薬局</h4>
                          <p className="text-gray-900">{selectedContract.pharmacy?.pharmacyName}</p>
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
                          <p className="text-yellow-800 text-sm mb-4">
                            💡 この採用オファーを承諾すると労働条件通知書が発行されます。
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                handleAcceptOffer(selectedContract.id);
                                setShowContractDetail(false);
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                            >
                              承諾する
                            </button>
                            <button
                              onClick={() => {
                                handleRejectOffer(selectedContract.id);
                                setShowContractDetail(false);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
                            >
                              辞退する
                            </button>
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

      case '出勤予定':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">出勤予定カレンダー</h2>
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
                <button
                  onClick={fetchSchedules}
                  disabled={isLoadingSchedules}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400"
                >
                  {isLoadingSchedules ? '読み込み中...' : '更新'}
                </button>
              </div>
            </div>

            {/* 重要なお知らせ */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-900 font-semibold mb-2 flex items-center">
                <span className="mr-2">⚠️</span> 日程変更について
              </h3>
              <p className="text-sm text-yellow-800">
                急な欠勤や追加出勤などのスケジュール変更は、必ず<strong>電話</strong>で薬局にご連絡ください。
              </p>
            </div>

            {/* カレンダー */}
            <div className="bg-white rounded-lg shadow p-6">
              {isLoadingSchedules ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">スケジュールを読み込んでいます...</p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">勤務スケジュールがありません</h3>
                  <p className="text-gray-600 mb-4">
                    契約が承認され、薬局がスケジュールを設定すると、ここに表示されます。
                  </p>
                </div>
              ) : (
                <div>
                  {/* 契約別サマリー */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">総出勤予定日数</p>
                      <p className="text-2xl font-bold text-blue-900">{schedules.length}日</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">今月の出勤予定</p>
                      <p className="text-2xl font-bold text-green-900">
                        {schedules.filter(s => {
                          const scheduleDate = new Date(s.workDate);
                          const now = new Date();
                          return scheduleDate.getMonth() === now.getMonth() && 
                                 scheduleDate.getFullYear() === now.getFullYear();
                        }).length}日
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">契約薬局数</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {[...new Set(schedules.map(s => s.contract?.pharmacy?.pharmacyName))].filter(Boolean).length}店舗
                      </p>
                    </div>
                  </div>

                  {/* カレンダー表示 */}
                  {calendarView === 'month' ? (
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
                          const daySchedules = schedules.filter(s => s.workDate.split('T')[0] === dateStr);
                          if (daySchedules.length > 0) {
                            return (
                              <div className="text-xs mt-1">
                                {daySchedules.map((schedule, idx) => (
                                  <div key={idx} className="text-blue-600 font-medium truncate">
                                    {schedule.contract?.pharmacy?.pharmacyName?.substring(0, 6) || '薬局'}
                                    <br />
                                    {schedule.scheduledStartTime?.substring(11, 16)}-{schedule.scheduledEndTime?.substring(11, 16)}
                                  </div>
                                ))}
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
                            const daySchedules = schedules.filter(s => s.workDate.split('T')[0] === dateStr);
                            
                            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                            const isWeekend = i === 0 || i === 6;
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            
                            return (
                              <div
                                key={i}
                                className={`border rounded-lg p-4 transition-all ${
                                  daySchedules.length > 0
                                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                    : 'bg-gray-50 border-gray-200'
                                } ${isToday ? 'ring-2 ring-yellow-400' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`text-center ${isWeekend ? 'text-red-600' : 'text-gray-700'}`}>
                                    <div className="text-xs font-medium">{dayNames[i]}</div>
                                    <div className="text-2xl font-bold">{date.getDate()}</div>
                                  </div>
                                  {daySchedules.length === 0 && (
                                    <div className="text-sm text-gray-400">休日</div>
                                  )}
                                </div>
                                
                                {daySchedules.length > 0 && (
                                  <div className="space-y-2">
                                    {daySchedules.map((schedule, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setSelectedSchedule(schedule);
                                          setShowScheduleDetail(true);
                                        }}
                                        className="cursor-pointer bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="font-semibold text-blue-900 mb-1">
                                              {schedule.contract?.pharmacy?.pharmacyName || '薬局名不明'}
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm">
                                              <Clock className="w-4 h-4 text-blue-600" />
                                              <span className="font-medium text-blue-900">
                                                {schedule.scheduledStartTime?.substring(11, 16)} - {schedule.scheduledEndTime?.substring(11, 16)}
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              {schedule.contract?.pharmacy?.prefecture} {schedule.contract?.pharmacy?.city}
                                            </div>
                                          </div>
                                          <div className="text-blue-600">
                                            <Eye className="w-5 h-5" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {schedules.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-900 font-semibold mb-2">💡 出勤予定カレンダーについて</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 青色でハイライトされた日が勤務予定日です</li>
                  <li>• 日付をクリックすると、その日の詳細が表示されます</li>
                  <li>• 複数の薬局と契約している場合、すべての予定がまとめて表示されます</li>
                  <li>• 日程変更が必要な場合は、必ず電話で薬局にご連絡ください</li>
                </ul>
              </div>
            )}

            {/* スケジュール詳細モーダル */}
            {showScheduleDetail && selectedSchedule && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">📅 出勤予定詳細</h3>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">勤務先</label>
                      <p className="text-gray-900 font-semibold">
                        {selectedSchedule.contract?.pharmacy?.pharmacyName || '薬局名不明'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedSchedule.contract?.pharmacy?.prefecture} {selectedSchedule.contract?.pharmacy?.city}
                      </p>
                    </div>

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
                      <p className="text-gray-900 text-lg font-semibold">
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
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">{selectedSchedule.notes}</p>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ 急な欠勤や時間変更は、必ず薬局に電話でご連絡ください。
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

      case 'プロフィール':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール</h2>
            </div>

            {/* 証明書アップロードセクション */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">📄 資格証明書</h3>
                <p className="text-sm text-gray-600 mt-1">
                  薬剤師免許証と保険薬剤師登録票をアップロードしてください
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* 本人確認ステータス */}
                {licenseInfo && (
                  <div className={`rounded-lg p-4 ${
                    licenseInfo.verificationStatus === 'approved' 
                      ? 'bg-green-50 border border-green-200'
                      : licenseInfo.verificationStatus === 'rejected'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold mb-1">
                          {licenseInfo.verificationStatus === 'approved' 
                            ? '✅ 本人確認済み'
                            : licenseInfo.verificationStatus === 'rejected'
                            ? '❌ 本人確認不可'
                            : '⏳ 本人確認待ち'}
                        </p>
                        <p className="text-sm text-gray-700">
                          {licenseInfo.verificationStatus === 'approved' 
                            ? '運営による本人確認が完了しています'
                            : licenseInfo.verificationStatus === 'rejected'
                            ? '証明書に問題があります。運営にお問い合わせください'
                            : '証明書をアップロードすると、運営が確認します'}
                        </p>
                        {licenseInfo.verifiedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            確認日時: {new Date(licenseInfo.verifiedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 薬剤師免許証 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">薬剤師免許証</h4>
                    {licenseInfo?.license.uploaded && (
                      <span className="text-sm text-green-600 font-medium">✓ アップロード済み</span>
                    )}
                  </div>

                  {licenseInfo?.license.uploaded ? (
                    /* アップロード済み表示 */
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">薬剤師免許証</p>
                              <p className="text-sm text-gray-600">
                                アップロード日: {licenseInfo.license.uploadedAt 
                                  ? new Date(licenseInfo.license.uploadedAt).toLocaleDateString('ja-JP')
                                  : '不明'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteLicense('license')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'license');
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={isUploadingLicense}
                          />
                          {isUploadingLicense ? '処理中...' : '再アップロード'}
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* アップロードフォーム */
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'license');
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={isUploadingLicense}
                          />
                          <div className="space-y-2">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-700 font-medium">
                              {isUploadingLicense ? 'アップロード中...' : 'ファイルを選択'}
                            </p>
                            <p className="text-sm text-gray-500">
                              PDF形式のみ対応（最大10MB）
                            </p>
                            <p className="text-xs text-blue-600">
                              ※JPGやPNGの場合は、PDFに変換してからアップロードしてください
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 保険薬剤師登録票 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">保険薬剤師登録票</h4>
                    {licenseInfo?.registration.uploaded && (
                      <span className="text-sm text-green-600 font-medium">✓ アップロード済み</span>
                    )}
                  </div>

                  {licenseInfo?.registration.uploaded ? (
                    /* アップロード済み表示 */
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">保険薬剤師登録票</p>
                              <p className="text-sm text-gray-600">
                                アップロード日: {licenseInfo.registration.uploadedAt 
                                  ? new Date(licenseInfo.registration.uploadedAt).toLocaleDateString('ja-JP')
                                  : '不明'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteLicense('registration')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'registration');
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={isUploadingRegistration}
                          />
                          {isUploadingRegistration ? '処理中...' : '再アップロード'}
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* アップロードフォーム */
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'registration');
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={isUploadingRegistration}
                          />
                          <div className="space-y-2">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-700 font-medium">
                              {isUploadingRegistration ? 'アップロード中...' : 'ファイルを選択'}
                            </p>
                            <p className="text-sm text-gray-500">
                              PDF形式のみ対応（最大10MB）
                            </p>
                            <p className="text-xs text-green-600">
                              ※JPGやPNGの場合は、PDFに変換してからアップロードしてください
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 注意事項 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-blue-900 font-semibold mb-2">💡 証明書アップロードについて</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 薬剤師免許証と保険薬剤師登録票の両方をアップロードしてください</li>
                    <li>• <strong>PDF形式のみ</strong>アップロード可能です（最大10MB）</li>
                    <li>• JPGやPNGの場合は、PDFに変換してからアップロードしてください</li>
                    <li>• 運営が内容を確認後、本人確認が完了します</li>
                    <li>• 本人確認完了後、すべての機能が利用可能になります</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* プロフィール編集セクション */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">プロフィール情報</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    基本情報や経歴を管理できます
                  </p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    編集する
                  </button>
                )}
              </div>

              <div className="p-6">
                {!profile ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">プロフィールを読み込んでいます...</h3>
                    <p className="text-gray-600">
                      プロフィール情報が表示されない場合は、ページをリロードしてください。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 基本情報 */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">基本情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            姓 <span className="text-red-500">*</span>
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.lastName || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          ) : (
                            <p className="text-gray-900">{profile.lastName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            名 <span className="text-red-500">*</span>
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.firstName || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          ) : (
                            <p className="text-gray-900">{profile.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            姓（カナ）
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.lastNameKana || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, lastNameKana: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.lastNameKana || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            名（カナ）
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.firstNameKana || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, firstNameKana: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.firstNameKana || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            電話番号
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="tel"
                              value={profileForm.phone || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="090-1234-5678"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.phone || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            生年月日
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="date"
                              value={profileForm.birthDate || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">
                              {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('ja-JP') : '未登録'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 住所情報 */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">住所情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            郵便番号
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.postalCode || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="123-4567"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.postalCode || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            都道府県
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.prefecture || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, prefecture: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="東京都"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.prefecture || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            市区町村
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.city || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="渋谷区"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.city || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            最寄り駅
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.nearestStation || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, nearestStation: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="渋谷駅"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.nearestStation || '未登録'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 資格情報 */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">資格情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            薬剤師免許番号
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileForm.licenseNumber || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.licenseNumber || '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            免許取得日
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="date"
                              value={profileForm.licenseIssuedDate || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, licenseIssuedDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">
                              {profile.licenseIssuedDate 
                                ? new Date(profile.licenseIssuedDate).toLocaleDateString('ja-JP')
                                : '未登録'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            卒業年
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="number"
                              value={profileForm.graduationYear || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, graduationYear: parseInt(e.target.value) || undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="2020"
                              min="1950"
                              max={new Date().getFullYear()}
                            />
                          ) : (
                            <p className="text-gray-900">{profile.graduationYear ? `${profile.graduationYear}年` : '未登録'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            実務経験年数
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="number"
                              value={profileForm.experienceYears || ''}
                              onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value) || undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="5"
                              min="0"
                              max="50"
                            />
                          ) : (
                            <p className="text-gray-900">{profile.experienceYears ? `${profile.experienceYears}年` : '未登録'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 自己紹介 */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">自己紹介</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プロフィール文
                        </label>
                        {isEditingProfile ? (
                          <textarea
                            value={profileForm.bio || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="薬剤師としての経験や得意分野などを記入してください"
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || '未登録'}</p>
                        )}
                      </div>
                    </div>

                    {/* 編集時のアクションボタン */}
                    {isEditingProfile && (
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingProfile}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile || !profileForm.firstName || !profileForm.lastName}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingProfile ? '保存中...' : '保存する'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            <h1 className="text-xl font-bold text-gray-800">薬剤師マッチング</h1>
            <div className="flex items-center mt-2">
              <User className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-sm text-gray-600">
                {profile ? `${profile.lastName} ${profile.firstName}` : '読み込み中...'}
              </p>
            </div>
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
        
        <div className="absolute bottom-0 w-full p-6 border-t bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">通知</span>
            <NotificationBell />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 cursor-pointer w-full"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">ログアウト</span>
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

      {/* 採用オファー通知モーダル */}
      {showOfferModal && pendingOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 animate-pulse-once">
            <div className="flex items-center justify-center mb-6">
              <Bell className="w-16 h-16 text-green-500 animate-bounce" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🎉 採用オファーが届きました！
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-3">
                {pendingOffer.pharmacy?.pharmacyName}
              </h3>
              <p className="text-gray-700 mb-2">
                求人: {pendingOffer.application?.jobPosting?.title}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {pendingOffer.pharmacy?.pharmacyName}から採用のオファーが届きました。
              </p>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  💡 <strong>働き始める</strong>を選択すると、労働条件通知書が自動で発行されます。
                </p>
                <p className="text-sm text-gray-700">
                  ⚠️ <strong>今回はお断りする</strong>を選択すると、この薬局とのメッセージが非表示になり、個人情報も公開されなくなります。
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleAcceptOffer(pendingOffer.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-medium text-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <CheckCircle className="w-6 h-6" />
                <span>働き始める</span>
              </button>
              <button
                onClick={() => handleRejectOffer(pendingOffer.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg font-medium text-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <XCircle className="w-6 h-6" />
                <span>今回はお断りする</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowOfferModal(false);
                setActiveMenu('勤務中薬局');
              }}
              className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 underline"
            >
              後で決める（勤務中の薬局画面で確認できます）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}