'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Eye,
  X,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  getAdminStatistics,
  getAdminPharmacists,
  getAdminPharmacistDetail,
  approvePharmacistVerification,
  rejectPharmacistVerification,
  resetPharmacistVerification,
  type PharmacistListItem,
  type PharmacistDetail,
  type Statistics
} from '@/lib/api';

export default function AdminPharmacistsPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [pharmacists, setPharmacists] = useState<PharmacistListItem[]>([]);
  const [filteredPharmacists, setFilteredPharmacists] = useState<PharmacistListItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // 詳細モーダル
  const [selectedPharmacist, setSelectedPharmacist] = useState<PharmacistDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // 却下モーダル
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = pharmacists;

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.verificationStatus === selectedStatus);
    }

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.licenseNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredPharmacists(filtered);
  }, [pharmacists, selectedStatus, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, pharmacistsData] = await Promise.all([
        getAdminStatistics(),
        getAdminPharmacists()
      ]);
      setStatistics(statsData);
      setPharmacists(pharmacistsData.pharmacists);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const detail = await getAdminPharmacistDetail(id);
      setSelectedPharmacist(detail);
    } catch (error) {
      console.error('Failed to fetch pharmacist detail:', error);
      alert('詳細の取得に失敗しました');
      setShowDetailModal(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPharmacist) return;
    if (!confirm('この薬剤師の本人確認を承認しますか？')) return;

    setIsProcessing(true);
    try {
      await approvePharmacistVerification(selectedPharmacist.id);
      alert('承認しました');
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('承認に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPharmacist) return;
    if (!rejectReason.trim()) {
      alert('却下理由を入力してください');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectPharmacistVerification(selectedPharmacist.id, rejectReason);
      alert('却下しました');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('却下に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!selectedPharmacist) return;
    if (!confirm('本人確認ステータスをリセットしますか？')) return;

    setIsProcessing(true);
    try {
      await resetPharmacistVerification(selectedPharmacist.id);
      alert('リセットしました');
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to reset:', error);
      alert('リセットに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            承認済み
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            却下
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            未確認
          </span>
        );
    }
  };

  const getLicenseFileUrl = (filename: string | null) => {
    if (!filename) return null;
    const name = filename.split('/').pop();
    const token = localStorage.getItem('token');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    return `${API_BASE_URL}/api/uploads/license/${name}?token=${token}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">運営管理画面</h1>
          <p className="mt-1 text-sm text-gray-600">薬剤師の本人確認管理</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 統計情報 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">全薬剤師</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">未確認</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">承認済み</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">却下</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* フィルター・検索 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ステータスフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータスフィルター
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'すべて' },
                  { value: 'pending', label: '未確認' },
                  { value: 'approved', label: '承認済み' },
                  { value: 'rejected', label: '却下' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value as typeof selectedStatus)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedStatus === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="名前、メール、免許番号で検索"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 薬剤師一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    薬剤師
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    免許番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地域
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    証明書
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPharmacists.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      該当する薬剤師が見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredPharmacists.map((pharmacist) => (
                    <tr key={pharmacist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pharmacist.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pharmacist.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pharmacist.licenseNumber || '未登録'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pharmacist.prefecture || '未登録'}
                        {pharmacist.city && ` ${pharmacist.city}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {pharmacist.licenseUploaded ? (
                            <span className="text-xs text-green-600">✓ 免許</span>
                          ) : (
                            <span className="text-xs text-gray-400">✗ 免許</span>
                          )}
                          {pharmacist.registrationUploaded ? (
                            <span className="text-xs text-green-600">✓ 登録票</span>
                          ) : (
                            <span className="text-xs text-gray-400">✗ 登録票</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(pharmacist.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pharmacist.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(pharmacist.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900">薬剤師詳細</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPharmacist(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLoadingDetail ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : selectedPharmacist ? (
                <div className="space-y-6">
                  {/* ステータスカード */}
                  <div className={`rounded-lg p-4 ${
                    selectedPharmacist.verificationStatus === 'approved'
                      ? 'bg-green-50 border border-green-200'
                      : selectedPharmacist.verificationStatus === 'rejected'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(selectedPharmacist.verificationStatus)}
                        {selectedPharmacist.verifiedAt && (
                          <p className="text-sm text-gray-600 mt-2">
                            確認日時: {new Date(selectedPharmacist.verifiedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                        {selectedPharmacist.verificationNotes && (
                          <p className="text-sm text-gray-700 mt-2">
                            メモ: {selectedPharmacist.verificationNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 基本情報 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">氏名</p>
                        <p className="text-gray-900 font-medium">{selectedPharmacist.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">フリガナ</p>
                        <p className="text-gray-900">{selectedPharmacist.fullNameKana || '未登録'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">メールアドレス</p>
                        <p className="text-gray-900">{selectedPharmacist.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">電話番号</p>
                        <p className="text-gray-900">{selectedPharmacist.phone || '未登録'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">免許番号</p>
                        <p className="text-gray-900">{selectedPharmacist.licenseNumber || '未登録'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">経験年数</p>
                        <p className="text-gray-900">{selectedPharmacist.experienceYears ? `${selectedPharmacist.experienceYears}年` : '未登録'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 証明書 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">証明書</h3>
                    
                    <div className="space-y-4">
                      {/* 薬剤師免許証 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">薬剤師免許証</h4>
                          {selectedPharmacist.licenseFilePath ? (
                            <span className="text-sm text-green-600">✓ アップロード済み</span>
                          ) : (
                            <span className="text-sm text-gray-400">✗ 未アップロード</span>
                          )}
                        </div>
                        {selectedPharmacist.licenseFilePath ? (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              アップロード日: {selectedPharmacist.licenseUploadedAt
                                ? new Date(selectedPharmacist.licenseUploadedAt).toLocaleDateString('ja-JP')
                                : '不明'}
                            </p>
                            <a
                              href={getLicenseFileUrl(selectedPharmacist.licenseFilePath) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              ファイルを表示
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">ファイルがアップロードされていません</p>
                        )}
                      </div>

                      {/* 保険薬剤師登録票 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">保険薬剤師登録票</h4>
                          {selectedPharmacist.registrationFilePath ? (
                            <span className="text-sm text-green-600">✓ アップロード済み</span>
                          ) : (
                            <span className="text-sm text-gray-400">✗ 未アップロード</span>
                          )}
                        </div>
                        {selectedPharmacist.registrationFilePath ? (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              アップロード日: {selectedPharmacist.registrationUploadedAt
                                ? new Date(selectedPharmacist.registrationUploadedAt).toLocaleDateString('ja-JP')
                                : '不明'}
                            </p>
                            <a
                              href={getLicenseFileUrl(selectedPharmacist.registrationFilePath) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              ファイルを表示
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">ファイルがアップロードされていません</p>
                        )}
                      </div>
                    </div>

                    {/* 警告メッセージ */}
                    {(!selectedPharmacist.licenseFilePath || !selectedPharmacist.registrationFilePath) && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          証明書が両方アップロードされていないため、承認できません
                        </p>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedPharmacist.verificationStatus === 'pending' && (
                      <>
                        <button
                          onClick={handleApprove}
                          disabled={!selectedPharmacist.licenseFilePath || !selectedPharmacist.registrationFilePath || isProcessing}
                          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          承認する
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          却下する
                        </button>
                      </>
                    )}
                    {selectedPharmacist.verificationStatus !== 'pending' && (
                      <button
                        onClick={handleReset}
                        disabled={isProcessing}
                        className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ステータスをリセット
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 却下理由入力モーダル */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">却下理由を入力</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="却下する理由を入力してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isProcessing}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '処理中...' : '却下する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



