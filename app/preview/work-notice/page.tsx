'use client';

import { useState } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkNoticePreviewPage() {
  const router = useRouter();
  
  // サンプルデータ
  const [noticeData, setNoticeData] = useState({
    contractNumber: 'CNT-2026-0125-001',
    issueDate: new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    pharmacyName: 'さくら薬局 渋谷店',
    pharmacyAddress: '東京都渋谷区神南1-2-3',
    pharmacistName: '山田 太郎',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    workDays: 30,
    dailyRate: 25000,
    jobDescription: '調剤業務、服薬指導、在宅医療サポート等',
    workHours: '9:00～18:00（実働8時間、休憩1時間）'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* ヘッダー（印刷時は非表示） */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>印刷・PDF保存</span>
            </button>
          </div>
        </div>
      </div>

      {/* 労働条件通知書本体 */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-8 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              労働条件通知書
            </h1>
            <p className="text-sm text-gray-600">Employment Terms Notice</p>
          </div>

          {/* 発行情報 */}
          <div className="text-right mb-8 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">発行日:</span> {noticeData.issueDate}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">契約番号:</span> {noticeData.contractNumber}
            </p>
          </div>

          {/* 雇用主 */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2">雇用主</span>
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-24 text-gray-600 font-medium">薬局名:</span>
                <span className="text-gray-900 font-semibold">{noticeData.pharmacyName}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-gray-600 font-medium">所在地:</span>
                <span className="text-gray-900">{noticeData.pharmacyAddress}</span>
              </div>
            </div>
          </div>

          {/* 労働者 */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2">労働者</span>
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-24 text-gray-600 font-medium">氏名:</span>
                <span className="text-gray-900 font-semibold">{noticeData.pharmacistName}</span>
              </div>
            </div>
          </div>

          {/* 労働条件 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 border-b-2 border-gray-300 pb-3 mb-5">
              労働条件
            </h2>

            {/* 1. 契約期間 */}
            <div className="mb-6 pl-4 border-l-4 border-blue-400">
              <h3 className="text-base font-bold text-gray-800 mb-3">1. 契約期間</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="w-32 font-medium">開始日:</span>
                  <span className="font-semibold text-blue-600">{noticeData.startDate}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 font-medium">勤務日数:</span>
                  <span className="font-semibold">{noticeData.workDays}日間</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ※ 体験期間終了後、双方の合意により正式雇用へ移行する場合があります
                </p>
              </div>
            </div>

            {/* 2. 就業場所 */}
            <div className="mb-6 pl-4 border-l-4 border-green-400">
              <h3 className="text-base font-bold text-gray-800 mb-3">2. 就業場所</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{noticeData.pharmacyName}</p>
                <p>{noticeData.pharmacyAddress}</p>
              </div>
            </div>

            {/* 3. 業務内容 */}
            <div className="mb-6 pl-4 border-l-4 border-purple-400">
              <h3 className="text-base font-bold text-gray-800 mb-3">3. 業務内容</h3>
              <div className="text-sm text-gray-700">
                <p>{noticeData.jobDescription}</p>
              </div>
            </div>

            {/* 4. 就業時間 */}
            <div className="mb-6 pl-4 border-l-4 border-yellow-400">
              <h3 className="text-base font-bold text-gray-800 mb-3">4. 就業時間</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{noticeData.workHours}</p>
                <p className="text-xs text-gray-500 mt-2">
                  ※ 詳細な勤務スケジュールは、雇用主と労働者が協議の上決定します
                </p>
              </div>
            </div>

            {/* 5. 休日 */}
            <div className="mb-6 pl-4 border-l-4 border-red-400">
              <h3 className="text-base font-bold text-gray-800 mb-3">5. 休日</h3>
              <div className="text-sm text-gray-700">
                <p>雇用主と労働者が協議の上決定</p>
                <p className="text-xs text-gray-500 mt-2">
                  ※ 勤務開始前に詳細なシフトを調整します
                </p>
              </div>
            </div>

            {/* 6. 賃金 */}
            <div className="mb-6 pl-4 border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
              <h3 className="text-base font-bold text-gray-800 mb-3">6. 賃金</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="w-48 font-medium">日給:</span>
                  <span className="text-xl font-bold text-orange-600">
                    ¥{noticeData.dailyRate.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 font-medium">賃金締切日・支払日:</span>
                  <span>体験期間終了後（要協議）</span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 font-medium">賃金支払方法:</span>
                  <span>銀行振込等（要協議）</span>
                </div>
                <div className="bg-orange-100 border border-orange-300 rounded p-3 mt-3">
                  <p className="text-xs text-orange-800">
                    <strong>💡 支払い総額の目安:</strong><br/>
                    日給 ¥{noticeData.dailyRate.toLocaleString()} × {noticeData.workDays}日 = 
                    <strong className="text-lg"> ¥{(noticeData.dailyRate * noticeData.workDays).toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 注記 */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-3">📋 本通知書について</h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• 本通知書は労働基準法第15条に基づき交付するものです。</li>
              <li>• 詳細な勤務スケジュールは、雇用主と労働者の協議により決定します。</li>
              <li>• 体験期間終了後、双方の合意により正式雇用へ移行することができます。</li>
              <li>• 本通知書の内容に変更がある場合は、速やかに相手方に通知するものとします。</li>
            </ul>
          </div>

          {/* 同意確認 */}
          <div className="mb-8 border-2 border-gray-300 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-700 mb-4">
              上記の労働条件で契約することに同意しました。
            </p>
            <div className="grid grid-cols-2 gap-6 text-left">
              <div>
                <p className="text-xs text-gray-600 mb-2">雇用主（薬局）</p>
                <div className="border-b-2 border-gray-300 pb-8"></div>
                <p className="text-xs text-gray-500 mt-1">署名または記名押印</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">労働者（薬剤師）</p>
                <div className="border-b-2 border-gray-300 pb-8"></div>
                <p className="text-xs text-gray-500 mt-1">署名または記名押印</p>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-300">
            <p className="font-semibold text-gray-800 mb-1">発行元</p>
            <p className="mb-1">薬剤師マッチングプラットフォーム運営事務局</p>
            <p className="mb-1">〒150-0000 東京都渋谷区xx-xx-xx</p>
            <p>お問い合わせ: support@yakunavi-platform.com</p>
            <p className="mt-3 text-xs text-gray-500">
              この労働条件通知書は、契約成立時に自動発行されたものです。
            </p>
          </div>
        </div>
      </div>

      {/* 説明（印刷時は非表示） */}
      <div className="max-w-4xl mx-auto mt-6 print:hidden">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 労働条件通知書プレビューについて</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>このページは労働条件通知書のモック（見本）です。</strong>
              実際のシステムでは、薬剤師が契約を承諾した時点で自動的にPDF形式で生成されます。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📝 実際の発行タイミング</h4>
              <ol className="space-y-1 text-blue-800">
                <li>1. 薬局が正式オファーを送信</li>
                <li>2. 薬剤師がオファーを承諾</li>
                <li>3. システムが労働条件通知書PDFを自動生成</li>
                <li>4. 薬局・薬剤師双方のダッシュボードからダウンロード可能</li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">⚖️ 労働基準法について</h4>
              <p className="text-green-800">
                この労働条件通知書は、労働基準法第15条に基づき、雇用主が労働者に対して明示すべき労働条件を記載したものです。
                法的に有効な書類として、双方が保管する必要があります。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}

