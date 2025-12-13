import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">薬剤師マッチング</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 mb-6">
            薬剤師マッチングプラットフォーム
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            薬剤師と薬局をつなぐ新しいマッチングサービス
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-500 text-4xl mb-4">👨‍⚕️</div>
              <h3 className="text-lg font-semibold mb-2">薬剤師の方へ</h3>
              <p className="text-gray-600 text-sm mb-4">
                実際に働いてから転職を判断。給料をもらいながら職場を吟味できます。
              </p>
              <Link
                href="/auth/register"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                薬剤師として登録
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-500 text-4xl mb-4">🏥</div>
              <h3 className="text-lg font-semibold mb-2">薬局の方へ</h3>
              <p className="text-gray-600 text-sm mb-4">
                実際の働きを見てから採用可能。採用の失敗リスクを大幅に削減できます。
              </p>
              <Link
                href="/auth/register"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                薬局として登録
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">今すぐ始めませんか？</h2>
            <p className="text-gray-600 mb-6">
              無料で会員登録して、理想の働き方・人材を見つけましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-center"
              >
                無料で会員登録
              </Link>
              <Link
                href="/auth/login"
                className="border border-blue-500 text-blue-500 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium text-center"
              >
                既にアカウントをお持ちの方
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}