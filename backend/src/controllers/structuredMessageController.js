const prisma = require('../database/prisma');
const { generateInvoicePDF, generateWorkNoticePDF } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/sendEmail');

/**
 * 構造化メッセージコントローラー
 * ボタン付きメッセージで初回出勤日の調整や正式オファーを送信
 */

// 初回出勤日の候補を提案（薬局側）
const proposeDates = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { applicationId, proposedDates } = req.body;

    // 薬局の権限確認
    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    if (application.job_postings.pharmacy_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'この応募にアクセスする権限がありません' });
    }

    // 構造化メッセージを作成
    const structuredMessage = await prisma.structured_messages.create({
      data: {
        application_id: applicationId,
        message_type: 'date_proposal',
        data: {
          proposedDates: proposedDates, // 候補日の配列
          message: '初回出勤日の候補を提案します。以下からご都合の良い日を選択してください。'
        },
        sent_by: 'pharmacy',
        sent_at: new Date()
      }
    });

    res.status(201).json({
      message: '日付候補を送信しました',
      structuredMessage
    });

  } catch (error) {
    console.error('Propose dates error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 初回出勤日を選択（薬剤師側）
const selectDate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId, selectedDate } = req.body;

    // 構造化メッセージを取得
    const message = await prisma.structured_messages.findUnique({
      where: { id: messageId },
      include: {
        job_applications: {
          include: {
            pharmacist_profiles: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'メッセージが見つかりません' });
    }

    if (message.job_applications.pharmacist_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'このメッセージにアクセスする権限がありません' });
    }

    if (message.message_type !== 'date_proposal') {
      return res.status(400).json({ error: '日付選択できるメッセージではありません' });
    }

    // 回答を記録
    const updatedMessage = await prisma.structured_messages.update({
      where: { id: messageId },
      data: {
        responded_at: new Date(),
        response_data: {
          selectedDate: selectedDate
        }
      }
    });

    // 薬剤師の回答を構造化メッセージとして記録
    await prisma.structured_messages.create({
      data: {
        application_id: message.application_id,
        message_type: 'date_selection',
        data: {
          selectedDate: selectedDate,
          message: `初回出勤日として ${selectedDate} を選択しました`
        },
        sent_by: 'pharmacist',
        sent_at: new Date()
      }
    });

    res.json({
      message: '日付を選択しました',
      structuredMessage: updatedMessage
    });

  } catch (error) {
    console.error('Select date error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 正式オファーを送信（薬局側）
const sendFormalOffer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      applicationId,
      initialWorkDate,
      workDays,
      dailyRate,
      workHours,
      paymentDeadline
    } = req.body;

    // 入力値のバリデーション
    if (!dailyRate || dailyRate < 20000) {
      return res.status(400).json({
        error: '日給は20,000円以上に設定してください'
      });
    }

    if (!workDays || workDays < 15 || workDays > 90) {
      return res.status(400).json({
        error: '勤務日数は15日〜90日の範囲で設定してください'
      });
    }

    // 薬局の権限確認
    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              include: {
                users: true
              }
            }
          }
        },
        pharmacist_profiles: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    if (application.job_postings.pharmacy_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'この応募にアクセスする権限がありません' });
    }

    // 報酬総額と手数料を自動計算
    const PLATFORM_FEE_RATE = 0.40; // プラットフォーム手数料：40%

    const totalCompensation = dailyRate * workDays; // 報酬総額
    const platformFeeAmount = Math.floor(totalCompensation * PLATFORM_FEE_RATE); // 手数料（40%）

    // 正式オファーの構造化メッセージを作成
    const structuredMessage = await prisma.structured_messages.create({
      data: {
        application_id: applicationId,
        message_type: 'formal_offer',
        data: {
          initialWorkDate,
          workDays,
          dailyRate: dailyRate,
          totalCompensation,
          workHours,
          platformFee: platformFeeAmount,
          platformFeeRate: PLATFORM_FEE_RATE,
          paymentDeadline,
          message: '正式な採用オファーをお送りします。内容をご確認の上、承諾または辞退をお選びください。'
        },
        sent_by: 'pharmacy',
        sent_at: new Date()
      }
    });

    // 契約レコードを作成（status: pending）
    const contract = await prisma.work_contracts.create({
      data: {
        application_id: applicationId,
        pharmacy_id: application.job_postings.pharmacy_id,
        pharmacist_id: application.pharmacist_id,
        job_posting_id: application.job_posting_id,
        initial_work_date: new Date(initialWorkDate),
        start_date: new Date(initialWorkDate),
        work_days: workDays,
        work_days_count: workDays,
        daily_rate: dailyRate,
        total_compensation: totalCompensation,
        status: 'pending',
        platform_fee_status: 'pending',
        personal_info_disclosed: false
      }
    });

    // プラットフォーム手数料レコードを作成
    const platformFeeRecord = await prisma.platform_fees.create({
      data: {
        contract_id: contract.id,
        pharmacy_id: application.job_postings.pharmacy_id,
        pharmacist_id: application.pharmacist_id,
        amount: platformFeeAmount,
        status: 'pending',
        payment_deadline: new Date(paymentDeadline)
      }
    });

    // 請求書PDFを生成
    try {
      const invoicePDF = await generateInvoicePDF({
        contractId: contract.id,
        invoiceNumber: `INV-${contract.id}-${Date.now()}`,
        pharmacyName: application.job_postings.pharmacy_profiles.pharmacy_name,
        pharmacistName: `${application.pharmacist_profiles.last_name} ${application.pharmacist_profiles.first_name}`,
        workDays,
        dailyRate,
        totalCompensation,
        platformFee: platformFeeAmount,
        paymentDeadline
      });

      // 請求書URLを保存
      await prisma.platform_fees.update({
        where: { id: platformFeeRecord.id },
        data: {
          invoice_url: invoicePDF.url
        }
      });

      // 薬局にメール送信
      try {
        const pharmacyUser = await prisma.users.findUnique({
          where: { id: application.job_postings.pharmacy_profiles.user_id }
        });

        if (pharmacyUser && pharmacyUser.email) {
          await sendEmail({
            to: pharmacyUser.email,
            subject: '【重要】プラットフォーム手数料のご請求',
            text: `
${application.job_postings.pharmacy_profiles.pharmacy_name} 様

薬剤師マッチングプラットフォームをご利用いただき、ありがとうございます。

契約が成立いたしましたので、プラットフォーム手数料をご請求申し上げます。

■ 契約情報
薬剤師: ${application.pharmacist_profiles.last_name} ${application.pharmacist_profiles.first_name}
勤務日数: ${workDays}日
報酬総額: ¥${totalCompensation.toLocaleString()}
初回出勤日: ${new Date(initialWorkDate).toLocaleDateString('ja-JP')}

■ ご請求金額
プラットフォーム手数料（報酬総額の40%）: ¥${platformFeeAmount.toLocaleString()}

■ お支払い期限
${new Date(paymentDeadline).toLocaleDateString('ja-JP')}

【重要なお知らせ】
• お支払い確認後、薬剤師の連絡先（氏名・電話番号・メールアドレス）を開示いたします
• 期限内にお支払いが確認できない場合、契約は自動キャンセルとなります
• 請求書PDFはマイページからダウンロードいただけます

振込先情報やご不明点は、マイページをご確認ください。

薬剤師マッチングプラットフォーム運営事務局
            `,
            html: `
              <h2>${application.job_postings.pharmacy_profiles.pharmacy_name} 様</h2>
              <p>薬剤師マッチングプラットフォームをご利用いただき、ありがとうございます。</p>
              <p>契約が成立いたしましたので、プラットフォーム手数料をご請求申し上げます。</p>
              
              <h3>■ 契約情報</h3>
              <ul>
                <li>薬剤師: ${application.pharmacist_profiles.last_name} ${application.pharmacist_profiles.first_name}</li>
                <li>勤務日数: ${workDays}日</li>
                <li>報酬総額: ¥${totalCompensation.toLocaleString()}</li>
                <li>初回出勤日: ${new Date(initialWorkDate).toLocaleDateString('ja-JP')}</li>
              </ul>
              
              <h3>■ ご請求金額</h3>
              <p style="font-size: 18px; font-weight: bold; color: #d97706;">
                プラットフォーム手数料（報酬総額の40%）: ¥${platformFeeAmount.toLocaleString()}
              </p>
              
              <h3>■ お支払い期限</h3>
              <p style="font-size: 16px; font-weight: bold; color: #dc2626;">
                ${new Date(paymentDeadline).toLocaleDateString('ja-JP')}
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0;">【重要なお知らせ】</h4>
                <ul>
                  <li>お支払い確認後、薬剤師の連絡先（氏名・電話番号・メールアドレス）を開示いたします</li>
                  <li>期限内にお支払いが確認できない場合、契約は自動キャンセルとなります</li>
                  <li>請求書PDFはマイページからダウンロードいただけます</li>
                </ul>
              </div>
              
              <p>振込先情報やご不明点は、マイページをご確認ください。</p>
              <p>薬剤師マッチングプラットフォーム運営事務局</p>
            `
          });
        }
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // メール送信失敗してもメインの処理は継続
      }

    } catch (pdfError) {
      console.error('Failed to generate invoice PDF:', pdfError);
      // PDF生成失敗してもメインの処理は継続
    }

    res.status(201).json({
      message: '正式オファーを送信しました',
      structuredMessage,
      contract,
      calculatedValues: {
        dailyRate: dailyRate,
        workDays,
        totalCompensation,
        platformFee: platformFeeAmount,
        platformFeeRate: `${PLATFORM_FEE_RATE * 100}%`
      }
    });

  } catch (error) {
    console.error('Send formal offer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// オファーに対する回答（薬剤師側：承諾/辞退）
const respondToOffer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId, response } = req.body; // response: 'accept' or 'decline'

    // 構造化メッセージを取得
    const message = await prisma.structured_messages.findUnique({
      where: { id: messageId },
      include: {
        job_applications: {
          include: {
            pharmacist_profiles: {
              include: {
                users: true
              }
            },
            work_contracts: {
              orderBy: {
                created_at: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'メッセージが見つかりません' });
    }

    if (message.job_applications.pharmacist_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'このメッセージにアクセスする権限がありません' });
    }

    if (message.message_type !== 'formal_offer') {
      return res.status(400).json({ error: 'オファーメッセージではありません' });
    }

    // 回答を記録
    const updatedMessage = await prisma.structured_messages.update({
      where: { id: messageId },
      data: {
        responded_at: new Date(),
        response_data: {
          response: response
        }
      }
    });

    // 回答メッセージを作成
    await prisma.structured_messages.create({
      data: {
        application_id: message.application_id,
        message_type: 'offer_response',
        data: {
          response: response,
          message: response === 'accept'
            ? 'オファーを承諾しました。よろしくお願いいたします。'
            : 'オファーを辞退させていただきます。'
        },
        sent_by: 'pharmacist',
        sent_at: new Date()
      }
    });

    // 契約ステータスを更新
    if (message.job_applications.work_contracts && message.job_applications.work_contracts.length > 0) {
      const contract = message.job_applications.work_contracts[0];
      await prisma.work_contracts.update({
        where: { id: contract.id },
        data: {
          status: response === 'accept' ? 'active' : 'declined'
        }
      });
    }

    res.json({
      message: response === 'accept' ? 'オファーを承諾しました' : 'オファーを辞退しました',
      structuredMessage: updatedMessage
    });

  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 応募に紐づく構造化メッセージを取得
const getStructuredMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { applicationId } = req.params;

    // 応募情報を取得して権限確認
    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              include: {
                users: true
              }
            }
          }
        },
        pharmacist_profiles: {
          include: {
            users: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // 薬局または薬剤師のいずれかであることを確認
    const isPharmacy = application.job_postings.pharmacy_profiles.users.id === userId;
    const isPharmacist = application.pharmacist_profiles.users.id === userId;

    if (!isPharmacy && !isPharmacist) {
      return res.status(403).json({ error: 'この応募にアクセスする権限がありません' });
    }

    // 構造化メッセージを取得
    const messages = await prisma.structured_messages.findMany({
      where: {
        application_id: applicationId
      },
      orderBy: {
        sent_at: 'asc'
      }
    });

    // データをフロントエンド用に整形
    const formattedMessages = messages.map(msg => {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      return {
        id: msg.id,
        applicationId: msg.application_id,
        messageType: msg.message_type,
        proposedDates: data.proposedDates || null,
        selectedDate: data.selectedDate || msg.selected_date || null,
        initialWorkDate: data.initialWorkDate || null,
        workDays: data.workDays || null,
        dailyRate: data.dailyRate || null,
        totalCompensation: data.totalCompensation || null,
        workHours: data.workHours || null,
        platformFee: data.platformFee || null,
        paymentDeadline: data.paymentDeadline || null,
        pharmacistResponse: data.response === 'accept' ? 'accepted' : data.response === 'decline' ? 'rejected' : null,
        sentBy: msg.sent_by,
        createdAt: msg.sent_at.toISOString(),
        updatedAt: msg.updated_at ? msg.updated_at.toISOString() : msg.sent_at.toISOString()
      };
    });

    res.json(formattedMessages);

  } catch (error) {
    console.error('Get structured messages error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  proposeDates,
  selectDate,
  sendFormalOffer,
  respondToOffer,
  getStructuredMessages
};

