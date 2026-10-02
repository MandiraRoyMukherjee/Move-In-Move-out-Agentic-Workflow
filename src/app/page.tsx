import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">
            A
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ANACITY</h1>
          <p className="text-lg text-gray-500">
            AI-Assisted Move-In / Move-Out Management
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          <Link
            href="/resident"
            className="group block p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              Resident Portal
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Submit move-in / move-out requests and track their status
            </p>
          </Link>

          <Link
            href="/admin"
            className="group block p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">🛠️</div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              Admin Portal
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Review requests, view AI assessments, and take action
            </p>
          </Link>
        </div>

        <p className="mt-10 text-xs text-gray-400">
          Demo prototype — authentication is simplified for demonstration
          purposes
        </p>
      </div>
    </main>
  );
}
