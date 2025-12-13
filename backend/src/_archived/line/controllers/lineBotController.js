const { Client } = require('@line/bot-sdk');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

// LINE Bot Client初期化
const client = new Client({
  channelAccessToken: process.env.LINE_BOT_ACCESS_TOKEN,
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET,
});

// 内部トークン生成（API呼び出し用）
const generateInternalToken = (userId) => {
  return jwt.sign(
    { userId, userType: 'pharmacist' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Webhook処理
const handleWebhook = async (req, res) => {
  try {
    const events = req.body.events;
    
    // 複数イベントの並列処理
    const promises = events.map(handleEvent);
    await Promise.all(promises);
    
    res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).end();
  }
};

// 個別イベント処理
const handleEvent = async (event) => {
  if (event.type !== 'message' && event.type !== 'postback') {
    return null;
  }

  const userId = event.source.userId;
  
  try {
    // LINEユーザーIDでデータベースユーザーを検索
    const userResult = await pool.query(
      'SELECT * FROM users WHERE line_user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '勤怠管理を利用するには、まずWebサイトでLINE連携を行ってください。\n' + 
              process.env.FRONTEND_URL || 'http://localhost:3000'
      });
    }

    const user = userResult.rows[0];

    // メッセージタイプによる分岐
    if (event.type === 'message') {
      return await handleTextMessage(event, user);
    } else if (event.type === 'postback') {
      return await handlePostback(event, user);
    }

  } catch (error) {
    console.error('Event handling error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。しばらくしてからお試しください。'
    });
  }
};

// テキストメッセージ処理
const handleTextMessage = async (event, user) => {
  const messageText = event.message.text.toLowerCase();

  switch (messageText) {
    case '出勤':
    case 'checkin':
      return await handleCheckIn(event, user);
    
    case '退勤':
    case 'checkout':
      return await handleCheckOut(event, user);
    
    case '状況':
    case 'status':
      return await handleStatus(event, user);
    
    case 'メニュー':
    case 'menu':
      return await sendRichMenu(event, user);
    
    default:
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '利用可能なコマンド:\n• 出勤 - 出勤記録\n• 退勤 - 退勤記録\n• 状況 - 勤怠状況確認\n• メニュー - リッチメニュー表示'
      });
  }
};

// ポストバック処理
const handlePostback = async (event, user) => {
  const data = event.postback.data;

  switch (data) {
    case 'action=checkin':
      return await handleCheckIn(event, user);
    
    case 'action=checkout':
      return await handleCheckOut(event, user);
    
    case 'action=status':
      return await handleStatus(event, user);
    
    default:
      return null;
  }
};

// 出勤処理
const handleCheckIn = async (event, user) => {
  try {
    // 勤怠APIを呼び出し
    const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/attendance/checkin`, 
      { notes: 'LINE経由出勤' },
      {
        headers: {
          'Authorization': `Bearer ${generateInternalToken(user.id)}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkInTime = new Date(response.data.attendance.checkInTime);
    const timeString = checkInTime.toLocaleTimeString('ja-JP');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 出勤記録を登録しました\n時刻: ${timeString}\n\nお疲れ様です！今日も一日頑張りましょう！`
    });

  } catch (error) {
    if (error.response && error.response.status === 400) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '⚠️ 本日は既に出勤済みです。'
      });
    }
    
    console.error('Check-in error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 出勤記録でエラーが発生しました。'
    });
  }
};

// 退勤処理
const handleCheckOut = async (event, user) => {
  try {
    const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/attendance/checkout`,
      { notes: 'LINE経由退勤' },
      {
        headers: {
          'Authorization': `Bearer ${generateInternalToken(user.id)}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const attendance = response.data.attendance;
    const checkOutTime = new Date(attendance.checkOutTime);
    const timeString = checkOutTime.toLocaleTimeString('ja-JP');
    const workHours = attendance.workHours;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 退勤記録を登録しました\n時刻: ${timeString}\n勤務時間: ${workHours}時間\n\nお疲れ様でした！`
    });

  } catch (error) {
    if (error.response && error.response.status === 400) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `❌ ${error.response.data.error}`
      });
    }
    
    console.error('Check-out error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 退勤記録でエラーが発生しました。'
    });
  }
};

// 勤怠状況確認
const handleStatus = async (event, user) => {
  try {
    const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/attendance/today`, {
      headers: {
        'Authorization': `Bearer ${generateInternalToken(user.id)}`
      }
    });

    const { status, message, attendance } = response.data;

    let statusMessage = `📊 本日の勤怠状況\n\n${message}`;

    if (attendance && attendance.checkInTime) {
      const checkInTime = new Date(attendance.checkInTime);
      statusMessage += `\n\n出勤時刻: ${checkInTime.toLocaleTimeString('ja-JP')}`;
      
      if (attendance.checkOutTime) {
        const checkOutTime = new Date(attendance.checkOutTime);
        statusMessage += `\n退勤時刻: ${checkOutTime.toLocaleTimeString('ja-JP')}`;
      }
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: statusMessage
    });

  } catch (error) {
    console.error('Status check error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 状況確認でエラーが発生しました。'
    });
  }
};

// リッチメニュー送信
const sendRichMenu = async (event, user) => {
  try {
    return client.replyMessage(event.replyToken, {
      type: 'template',
      altText: '勤怠管理メニュー',
      template: {
        type: 'buttons',
        title: '勤怠管理',
        text: '操作を選択してください',
        actions: [
          {
            type: 'postback',
            label: '出勤',
            data: 'action=checkin'
          },
          {
            type: 'postback',
            label: '退勤',
            data: 'action=checkout'
          },
          {
            type: 'postback',
            label: '状況確認',
            data: 'action=status'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Rich menu error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ メニュー表示でエラーが発生しました。'
    });
  }
};

// プッシュメッセージ送信（管理者用）
const sendPushMessage = async (req, res) => {
  try {
    const { lineUserId, message } = req.body;

    if (!lineUserId || !message) {
      return res.status(400).json({ error: 'LINE User IDとメッセージは必須です' });
    }

    await client.pushMessage(lineUserId, {
      type: 'text',
      text: message
    });

    res.json({ message: 'メッセージを送信しました' });

  } catch (error) {
    console.error('Push message error:', error);
    res.status(500).json({ error: 'メッセージ送信でエラーが発生しました' });
  }
};

module.exports = {
  handleWebhook,
  sendPushMessage
};