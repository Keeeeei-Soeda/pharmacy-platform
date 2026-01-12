const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * プラットフォーム手数料請求書PDF生成
 */
const generateInvoicePDF = (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      // PDFディレクトリの確保
      const pdfDir = path.join(__dirname, '../../uploads/invoices');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // ファイル名生成
      const fileName = `invoice-${invoiceData.contractId}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      // PDFドキュメント作成
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // ヘッダー
      doc.fontSize(20)
         .text('プラットフォーム手数料 請求書', { align: 'center' })
         .moveDown();

      // 請求書番号と発行日
      doc.fontSize(10)
         .text(`請求書番号: ${invoiceData.invoiceNumber || invoiceData.contractId}`, { align: 'right' })
         .text(`発行日: ${new Date().toLocaleDateString('ja-JP')}`, { align: 'right' })
         .moveDown(2);

      // 宛先
      doc.fontSize(12)
         .text('ご請求先', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(11)
         .text(`${invoiceData.pharmacyName} 様`)
         .moveDown(2);

      // 請求内容
      doc.fontSize(12)
         .text('請求内容', { underline: true })
         .moveDown(0.5);

      // テーブルヘッダー
      const tableTop = doc.y;
      const col1X = 70;
      const col2X = 350;
      const col3X = 450;

      doc.fontSize(10)
         .text('項目', col1X, tableTop)
         .text('金額', col3X, tableTop);

      doc.moveTo(50, tableTop + 20)
         .lineTo(550, tableTop + 20)
         .stroke();

      // テーブル行
      let rowY = tableTop + 30;

      doc.text('薬剤師採用マッチングサービス利用料', col1X, rowY);
      doc.text(`¥${invoiceData.totalCompensation.toLocaleString()}`, col3X, rowY, { align: 'right' });
      rowY += 20;

      doc.fontSize(9)
         .fillColor('gray')
         .text(`（日給 ¥25,000 × ${invoiceData.workDays}日）`, col1X + 20, rowY);
      rowY += 25;

      doc.fontSize(10)
         .fillColor('black')
         .text('プラットフォーム手数料（40%）', col1X, rowY);
      doc.text(`¥${invoiceData.platformFee.toLocaleString()}`, col3X, rowY, { align: 'right' });
      rowY += 30;

      // 合計
      doc.moveTo(50, rowY - 10)
         .lineTo(550, rowY - 10)
         .stroke();

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('ご請求金額合計', col1X, rowY);
      doc.fontSize(14)
         .text(`¥${invoiceData.platformFee.toLocaleString()}`, col3X, rowY, { align: 'right' });

      rowY += 40;

      // 支払い情報
      doc.fontSize(12)
         .font('Helvetica')
         .text('お支払い情報', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10)
         .text(`お支払い期限: ${new Date(invoiceData.paymentDeadline).toLocaleDateString('ja-JP')}`)
         .moveDown(0.3)
         .text('振込先銀行: [銀行名]')
         .text('支店名: [支店名]')
         .text('口座種別: 普通')
         .text('口座番号: [口座番号]')
         .text('口座名義: [口座名義]')
         .moveDown(1);

      // 重要事項
      doc.fontSize(11)
         .fillColor('red')
         .text('【重要】', { continued: true })
         .fillColor('black')
         .text(' お支払い確認後、薬剤師の連絡先を開示いたします。', { continued: false })
         .moveDown(0.3)
         .fontSize(10)
         .text('• 初回出勤日の3日前までにお支払いください。')
         .text('• 期限内にお支払いが確認できない場合、契約は自動キャンセルとなります。')
         .text('• 振込手数料はご負担をお願いいたします。')
         .moveDown(2);

      // フッター
      doc.fontSize(9)
         .fillColor('gray')
         .text('発行元: 薬剤師マッチングプラットフォーム運営事務局', { align: 'center' })
         .text('お問い合わせ: support@example.com', { align: 'center' });

      // PDF生成完了
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          url: `/uploads/invoices/${fileName}`
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 労働条件通知書PDF生成
 */
const generateWorkNoticePDF = (noticeData) => {
  return new Promise((resolve, reject) => {
    try {
      // PDFディレクトリの確保
      const pdfDir = path.join(__dirname, '../../uploads/work-notices');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // ファイル名生成
      const fileName = `work-notice-${noticeData.contractId}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      // PDFドキュメント作成
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // タイトル
      doc.fontSize(18)
         .text('労働条件通知書', { align: 'center' })
         .moveDown(2);

      // 発行日
      doc.fontSize(10)
         .text(`発行日: ${new Date().toLocaleDateString('ja-JP')}`)
         .text(`契約番号: ${noticeData.contractId}`)
         .moveDown(1.5);

      // 雇用主
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('【雇用主】')
         .font('Helvetica')
         .fontSize(10)
         .text(`薬局名: ${noticeData.pharmacyName}`)
         .text(`所在地: ${noticeData.pharmacyAddress}`)
         .moveDown(1);

      // 労働者
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('【労働者】')
         .font('Helvetica')
         .fontSize(10)
         .text(`氏名: ${noticeData.pharmacistName}`)
         .moveDown(1);

      // 労働条件
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('【労働条件】')
         .font('Helvetica')
         .fontSize(10)
         .moveDown(0.5);

      doc.text('1. 契約期間')
         .text(`   開始日: ${new Date(noticeData.startDate).toLocaleDateString('ja-JP')}`)
         .text(`   勤務日数: ${noticeData.workDays}日`)
         .moveDown(0.5);

      doc.text('2. 就業場所')
         .text(`   ${noticeData.pharmacyName}`)
         .text(`   ${noticeData.pharmacyAddress}`)
         .moveDown(0.5);

      doc.text('3. 業務内容')
         .text(`   ${noticeData.jobDescription || '調剤業務、服薬指導等'}`)
         .moveDown(0.5);

      doc.text('4. 就業時間')
         .text(`   ${noticeData.workHours || '薬局と協議の上決定'}`)
         .moveDown(0.5);

      doc.text('5. 休日')
         .text(`   薬局と協議の上決定`)
         .moveDown(0.5);

      doc.text('6. 賃金')
         .text(`   日給: ¥25,000`)
         .text(`   賃金締切日・支払日: 体験期間終了後（要協議）`)
         .text(`   賃金支払方法: 銀行振込等（要協議）`)
         .moveDown(1);

      // 注記
      doc.fontSize(9)
         .fillColor('gray')
         .text('※ 詳細な勤務スケジュールは雇用主と労働者の協議により決定します。')
         .text('※ 本通知書は労働基準法第15条に基づき交付するものです。')
         .moveDown(2);

      // 署名欄（簡易版）
      doc.fontSize(10)
         .fillColor('black')
         .text('上記の労働条件で契約することに同意しました。')
         .moveDown(3);

      // フッター
      doc.fontSize(9)
         .fillColor('gray')
         .text('発行元: 薬剤師マッチングプラットフォーム運営事務局', { align: 'center' });

      // PDF生成完了
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath,
          fileName,
          url: `/uploads/work-notices/${fileName}`
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateWorkNoticePDF
};

