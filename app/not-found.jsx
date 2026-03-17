import Link from 'next/link';
import Button from '@/components/ui/Button';
import BackLink from '@/components/ui/BackLink';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center
      pt-16 md:pt-24 bg-white px-4 sm:px-6 relative overflow-hidden">

      {/* Background SVG */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url("/not-found.svg")',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      />

      {/* Back Link */}
      {/* <div className="absolute top-6 left-6 z-20">
        <BackLink useRouterBack={true} label="Go Back" />
      </div> */}

      <div className="max-w-3xl w-full text-center space-y-6 md:space-y-8 relative z-10 flex flex-col items-center">

        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#373a40]">
          Coming Soon
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
          We’re working on something exciting. Stay tuned.
          <br className="hidden sm:block" /> This feature is currently under development and will be available soon.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Button
            href="/"
            text="Home Page"
            className="w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4
              bg-[#4a4c56] text-white text-base sm:text-lg font-medium
              hover:bg-[#373a40] shadow-lg shadow-gray-200"
          />
        </div>
      </div>
    </main>
  );
}
