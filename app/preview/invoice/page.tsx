'use client';

import { useState } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoicePreviewPage() {
  const router = useRouter();
  
  // サンプルデータ
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-2026-0125-001',
    issueDate: new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    pharmacyName: 'さくら薬局 渋谷店',
    pharmacistName: '山田 太郎',
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
    })
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

      {/* 請求書本体 */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-8 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              プラットフォーム手数料 請求書
            </h1>
            <p className="text-sm text-gray-600">Platform Fee Invoice</p>
          </div>

          {/* 請求書番号と発行日 */}
          <div className="text-right mb-8 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">請求書番号:</span> {invoiceData.invoiceNumber}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">発行日:</span> {invoiceData.issueDate}
            </p>
          </div>

          {/* 宛先 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3">
              ご請求先
            </h2>
            <p className="text-xl font-semibold text-gray-900">
              {invoiceData.pharmacyName} 様
            </p>
          </div>

          {/* 請求内容 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">
              請求内容
            </h2>
            
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">項目</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">金額</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-2">
                    <p className="font-medium text-gray-900">薬剤師採用マッチングサービス利用料</p>
                    <p className="text-sm text-gray-600 mt-1">
                      薬剤師: {invoiceData.pharmacistName}
                    </p>
                    <p className="text-sm text-gray-600">
                      初回出勤日: {invoiceData.initialWorkDate}
                    </p>
                  </td>
                  <td className="py-4 px-2 text-right font-medium text-gray-900">
                    ¥{invoiceData.totalCompensation.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-2 pl-8">
                    <p className="text-sm text-gray-600">
                      （日給 ¥{invoiceData.dailyRate.toLocaleString()} × {invoiceData.workDays}日）
                    </p>
                  </td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-2">
                    <p className="font-medium text-gray-900">
                      プラットフォーム手数料（{(invoiceData.platformFeeRate * 100)}%）
                    </p>
                  </td>
                  <td className="py-4 px-2 text-right font-medium text-gray-900">
                    ¥{invoiceData.platformFee.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800">
                  <td className="py-4 px-2">
                    <p className="text-xl font-bold text-gray-900">ご請求金額合計</p>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{invoiceData.platformFee.toLocaleString()}
                    </p>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* お支払い情報 */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">お支払い情報</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800 font-medium">お支払い期限:</span>
                <span className="text-blue-900 font-bold">{invoiceData.paymentDeadline}</span>
              </div>
              <div className="border-t border-blue-300 my-3"></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-blue-700 font-medium">振込先銀行:</p>
                  <p className="text-blue-900">三菱UFJ銀行</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">支店名:</p>
                  <p className="text-blue-900">渋谷支店</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">口座種別:</p>
                  <p className="text-blue-900">普通預金</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">口座番号:</p>
                  <p className="text-blue-900">1234567</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-blue-700 font-medium">口座名義:</p>
                <p className="text-blue-900">カ）ヤクザイシマッチングプラットフォーム</p>
              </div>
            </div>
          </div>

          {/* 重要事項 */}
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-500 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              【重要】お支払いに関する注意事項
            </h3>
            <ul className="space-y-2 text-sm text-gray-800">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>
                  <strong>お支払い確認後、薬剤師の連絡先（氏名・電話番号・メールアドレス）を開示いたします。</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>初回出勤日の3日前までにお支払いください。</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>
                  期限内にお支払いが確認できない場合、<strong className="text-red-600">契約は自動キャンセル</strong>となります。
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>振込手数料はご負担をお願いいたします。</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  薬剤師への報酬（¥{invoiceData.totalCompensation.toLocaleString()}）は、体験期間終了後に直接お支払いください。
                </span>
              </li>
            </ul>
          </div>

          {/* フッター */}
          <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-300">
            <p className="font-semibold text-gray-800 mb-1">発行元</p>
            <p className="mb-1">薬剤師マッチングプラットフォーム運営事務局</p>
            <p className="mb-1">〒150-0000 東京都渋谷区xx-xx-xx</p>
            <p>お問い合わせ: support@yakunavi-platform.com</p>
            <p className="mt-3 text-xs text-gray-500">
              この請求書は、契約成立時に自動発行されたものです。
            </p>
          </div>
        </div>
      </div>

      {/* 説明（印刷時は非表示） */}
      <div className="max-w-4xl mx-auto mt-6 print:hidden">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 請求書プレビューについて</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>このページは請求書のモック（見本）です。</strong>
              実際のシステムでは、契約成立時に自動的にPDF形式で生成されます。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📝 実際の発行タイミング</h4>
              <ol className="space-y-1 text-blue-800">
                <li>1. 薬局が正式オファーを送信</li>
                <li>2. システムが請求書PDFを自動生成</li>
                <li>3. 薬局のメールアドレスに自動送信</li>
                <li>4. 薬局ダッシュボードの「プラットフォーム手数料管理」タブからダウンロード可能</li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">💡 確認方法</h4>
              <ul className="space-y-1 text-green-800">
                <li>• 「印刷・PDF保存」ボタンで印刷プレビューを確認できます</li>
                <li>• ブラウザの印刷機能で「PDFに保存」を選択すると、PDFとして保存できます</li>
                <li>• レイアウトや内容を確認してください</li>
              </ul>
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

