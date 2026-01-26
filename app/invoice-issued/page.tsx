'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle } from 'lucide-react';

export default function InvoiceIssuedPage() {
  // サンプルデータ
  const [invoiceData] = useState({
    invoiceNumber: 'INV-2026-0125-001',
    issueDate: new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    pharmacyName: 'さくら薬局 渋谷店',
    pharmacyAddress: '東京都渋谷区道玄坂1-2-3',
    pharmacyPhone: '03-1234-5678',
    pharmacistName: '山田 太郎',
    contractNumber: 'CNT-2026-0125-001',
    workDays: 30,
    dailyRate: 25000,
    totalCompensation: 750000,
    platformFeeRate: 0.40,
    platformFee: 300000,
    paymentDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    initialWorkDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    bankName: '三菱UFJ銀行',
    branchName: '渋谷支店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolder: 'カ）ヤクナビ'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('実際のシステムでは、PDFファイルがダウンロードされます');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* ヘッダー（印刷時は非表示） */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">請求書が発行されました</h1>
              <p className="text-gray-600">契約が正常に成立しました</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>重要:</strong> プラットフォーム手数料のお支払い期限は <strong className="text-blue-900">{invoiceData.paymentDeadline}</strong> です。
              お支払い確認後、薬剤師の個人情報が開示されます。
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>印刷</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>PDFダウンロード</span>
            </button>
          </div>
        </div>
      </div>

      {/* 請求書本体 */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none" style={{ minHeight: '297mm' }}>
        <div className="p-8 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">プラットフォーム手数料 請求書</h1>
            <p className="text-gray-600">Platform Fee Invoice</p>
          </div>

          {/* 請求書番号・発行日 */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
            <div>
              <p className="text-sm text-gray-600">請求書番号</p>
              <p className="text-xl font-bold text-gray-800">{invoiceData.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">発行日</p>
              <p className="text-lg font-semibold text-gray-800">{invoiceData.issueDate}</p>
            </div>
          </div>

          {/* 宛先 */}
          <div className="mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">請求先</p>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{invoiceData.pharmacyName} 御中</h2>
              <p className="text-gray-700">{invoiceData.pharmacyAddress}</p>
              <p className="text-gray-700">TEL: {invoiceData.pharmacyPhone}</p>
            </div>
          </div>

          {/* 契約情報 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">契約情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">契約番号</p>
                <p className="text-lg font-semibold text-gray-800">{invoiceData.contractNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">薬剤師名</p>
                <p className="text-lg font-semibold text-gray-800">{invoiceData.pharmacistName} 様</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">勤務予定日数</p>
                <p className="text-lg font-semibold text-gray-800">{invoiceData.workDays}日</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">初回勤務予定日</p>
                <p className="text-lg font-semibold text-gray-800">{invoiceData.initialWorkDate}</p>
              </div>
            </div>
          </div>

          {/* 請求内訳 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">請求内訳</h3>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 text-gray-700">項目</th>
                  <th className="text-right p-3 text-gray-700">金額</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-800">薬剤師紹介サービス利用料</td>
                  <td className="text-right p-3 text-gray-800">¥{invoiceData.totalCompensation.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-800">プラットフォーム手数料（{(invoiceData.platformFeeRate * 100).toFixed(0)}%）</td>
                  <td className="text-right p-3 text-gray-800">¥{invoiceData.platformFee.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* 合計金額 */}
            <div className="mt-6 bg-blue-50 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">お支払い金額（税込）</span>
                <span className="text-3xl font-bold text-blue-600">¥{invoiceData.platformFee.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 支払い情報 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">お振込先情報</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">銀行名:</span>
                  <span className="text-gray-800">{invoiceData.bankName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">支店名:</span>
                  <span className="text-gray-800">{invoiceData.branchName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">口座種別:</span>
                  <span className="text-gray-800">{invoiceData.accountType}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">口座番号:</span>
                  <span className="text-gray-800 text-lg font-bold">{invoiceData.accountNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">口座名義:</span>
                  <span className="text-gray-800">{invoiceData.accountHolder}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-700 font-semibold">お支払い期限:</span>
                  <span className="text-red-600 font-bold text-lg">{invoiceData.paymentDeadline}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 重要事項 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">重要事項</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>お支払い確認後、薬剤師の個人情報（連絡先、免許証情報等）が開示されます。</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>期限内にお支払いが確認できない場合、契約がキャンセルされる場合があります。</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>お振込の際は、請求書番号（{invoiceData.invoiceNumber}）をお振込名義人欄にご記入ください。</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>振込手数料は貴社にてご負担ください。</span>
                </li>
              </ul>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <div className="text-center text-gray-600">
              <p className="font-bold text-gray-800 text-lg mb-2">ヤクナビ運営事務局</p>
              <p className="text-sm">お問い合わせ: support@yakunavi.jp</p>
              <p className="text-sm">TEL: 0120-XXX-XXXX（平日 9:00-18:00）</p>
            </div>
          </div>
        </div>
      </div>

      {/* 印刷時のページ設定 */}
      <style jsx>{`
        @media print {
          body {
            background: white;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}

