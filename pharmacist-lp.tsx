'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PharmacistLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('pharmacist');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 薬剤師側のメリット
  const pharmacistBenefits = [
    {
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
      title: '実際に働いてから転職を判断',
      description: 'トライアル勤務で職場の雰囲気、人間関係、業務内容を体験してから本採用を決定できます。',
      imagePosition: 'left'
    },
    {
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      title: '給料をもらいながら転職活動',
      description: 'トライアル期間中も時給が発生。収入を得ながら自分に合う職場を探せます。',
      imagePosition: 'right'
    }
  ];

  // 薬局側のメリット
  const pharmacyBenefits = [
    {
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      title: '実際の働きを見てから採用',
      description: 'トライアル勤務で実際のスキル、人柄、職場との相性を確認してから本採用を判断できます。',
      imagePosition: 'left'
    },
    {
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
      title: '採用コストを大幅削減',
      description: '紹介手数料不要。トライアル期間の時給のみで、低コストで優秀な人材を採用できます。',
      imagePosition: 'right'
    }
  ];

  const stats = [
    { number: '95%', label: 'トライアル後の本採用率' },
    { number: '5,000+', label: '提携薬局・病院' },
    { number: '100%', label: '満足保証（合わなければ次へ）' },
    { number: '0円', label: '薬剤師の利用料金' }
  ];

  const steps = [
    { step: '1', title: '無料登録', desc: '1分で完了' },
    { step: '2', title: '求人応募 / 応募者確認', desc: '気になる求人に応募' },
    { step: '3', title: 'トライアル勤務開始', desc: '実際に働いてみる' },
    { step: '4', title: '本採用決定', desc: '双方が納得したら' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* ヘッダー */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  薬剤師キャリアナビ
                </h1>
                <p className="text-xs text-gray-500">理想のキャリアを、一緒に</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-teal-600 transition-colors">
                ログイン
              </button>
              <motion.button
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                無料登録
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ファーストビュー */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* 背景画像 */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 opacity-95"></div>
          <img 
            src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1920&h=1080&fit=crop" 
            alt="薬剤師" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        {/* アニメーション背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-20">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-block mb-4 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              ✨ トライアル勤務で、失敗しない転職を実現
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                働いてから決める、
              </span>
              <br />
              <span className="text-gray-900">
                新しい転職のカタチ。
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
              トライアル勤務で職場を体験。<br className="hidden md:block" />
              <span className="font-bold text-teal-600">給料をもらいながら</span>、本当に合う職場を見つけられる。
            </p>

            <div className="flex flex-col gap-6 items-center mb-8">
              {/* 薬剤師向けボタン */}
              <div className="w-full max-w-2xl">
                <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                  💊 薬剤師の方
                </div>
                <motion.button
                  className="w-full px-10 py-5 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    薬剤師として無料登録
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>
              </div>

              {/* 薬局向けボタン */}
              <div className="w-full max-w-2xl">
                <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                  🏥 薬局・病院の採用担当者の方
                </div>
                <motion.button
                  className="w-full px-10 py-5 bg-white text-gray-700 text-lg font-bold rounded-2xl border-2 border-teal-500 hover:bg-teal-50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    採用担当者として登録
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="w-full sm:w-auto px-8 py-3 bg-white text-teal-600 text-base font-medium rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                サービス詳細を見る
              </motion.button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              登録完了まで約1分 | 完全無料 | 非公開求人多数
            </div>
          </motion.div>
        </div>
      </section>

      {/* 統計データ */}
      <section className="py-16 px-4 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* サービスの特徴 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              選ばれる理由
            </h2>
            <p className="text-xl text-gray-600">
              薬剤師の方も、薬局・病院の方も安心してご利用いただけます
            </p>
          </motion.div>

          {/* タブ切り替え */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'pharmacist'
                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('pharmacist')}
              >
                💊 薬剤師の方
              </button>
              <button
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'pharmacy'
                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('pharmacy')}
              >
                🏥 薬局・病院の方
              </button>
            </div>
          </div>

          {/* 薬剤師向けメリット */}
          {activeTab === 'pharmacist' && (
            <motion.div
              key="pharmacist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {pharmacistBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className={`bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-teal-500 hover:to-blue-600`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`flex flex-col ${benefit.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
                    {/* 画像 */}
                    <div className="w-full md:w-1/2 h-64 md:h-80 overflow-hidden">
                      <img 
                        src={benefit.image} 
                        alt={benefit.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* テキスト */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 group-hover:text-white transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-gray-600 group-hover:text-white/90 transition-colors">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* 薬局向けメリット */}
          {activeTab === 'pharmacy' && (
            <motion.div
              key="pharmacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {pharmacyBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className={`bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-teal-500 hover:to-blue-600`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`flex flex-col ${benefit.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
                    {/* 画像 */}
                    <div className="w-full md:w-1/2 h-64 md:h-80 overflow-hidden">
                      <img 
                        src={benefit.image} 
                        alt={benefit.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* テキスト */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 group-hover:text-white transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-gray-600 group-hover:text-white/90 transition-colors">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* 利用の流れ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              ご利用の流れ
            </h2>
            <p className="text-xl text-gray-600">
              シンプルな4ステップで、理想の職場へ
            </p>
          </motion.div>

          <div className="relative">
            {/* 接続線 */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 transform -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg group-hover:scale-110 transition-transform">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-center">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* トライアル勤務とは */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              トライアル勤務とは？
            </h2>
            <p className="text-xl text-gray-600">
              実際に働いてから判断できる、新しい転職の仕組み
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* ヒーロー画像 */}
            <motion.div
              className="mb-8 rounded-3xl overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=600&fit=crop" 
                alt="薬局での仕事風景" 
                className="w-full h-64 md:h-96 object-cover"
              />
            </motion.div>

            <motion.div
              className="bg-white rounded-3xl p-8 md:p-12 shadow-xl mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                従来の転職では、入社してから「想像と違った...」と後悔することも。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                当サービスの<span className="font-bold text-teal-600">トライアル勤務</span>なら、<br />
                実際に働いてから判断できるので、<span className="font-bold text-teal-600">失敗しない転職</span>が実現します。
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-teal-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    トライアル期間中
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-teal-600 font-bold mt-1">✓</span>
                      <span>時給が発生（給料をもらいながら体験）</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-teal-600 font-bold mt-1">✓</span>
                      <span>簡単な勤怠管理</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-teal-600 font-bold mt-1">✓</span>
                      <span>いつでも次の職場を探せる</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    本採用前に確認できること
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span>職場の雰囲気・人間関係</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span>実際の業務内容・忙しさ</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span>通勤のしやすさ</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span>働きやすさ・相性</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              まずはトライアル勤務で<br />
              本当に合う職場を見つけませんか？
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10">
              登録も利用も完全無料。気軽に始められます。
            </p>

            <motion.button
              className="px-12 py-6 bg-white text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 text-xl font-black rounded-2xl shadow-2xl hover:shadow-3xl transition-all inline-flex items-center gap-3 group"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              今すぐ無料登録
              <svg className="w-6 h-6 text-teal-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>

            <div className="mt-8 flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                完全無料
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                登録1分
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                非公開求人多数
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">薬剤師キャリアナビ</h3>
              <p className="text-gray-400 text-sm">
                理想のキャリアを実現する転職支援サービス
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-teal-400 transition-colors">求人検索</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">キャリア相談</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">転職ガイド</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">会社情報</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-teal-400 transition-colors">会社概要</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">採用情報</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">その他</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-teal-400 transition-colors">利用規約</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">特定商取引法</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Pharmacist Career Navi. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
