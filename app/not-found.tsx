import Link from 'next/link';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pt-16 bg-[#FAF7F1] min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-bold text-[#E7DFD2] mb-6">404</p>
        <h1 className="text-3xl font-bold text-[#1F2421] mb-3">Page not found</h1>
        <p className="text-[#6F6A61] mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F2421] text-white font-semibold rounded-full hover:bg-[#123C5A] transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/concepts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1F2421] font-semibold rounded-full border border-[#E7DFD2] hover:border-[#1F2421] transition-colors text-sm"
          >
            Explore Concepts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
