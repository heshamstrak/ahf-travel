import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-medium text-gold-500">404</p>
      <h1 className="mt-4 font-display text-3xl font-medium text-slate-900">This page has wandered off</h1>
      <p className="mt-3 text-slate-600">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/">Back to Home</Button>
        <Button href="/hotels" variant="outline">
          Browse Hotels
        </Button>
      </div>
    </div>
  );
}
