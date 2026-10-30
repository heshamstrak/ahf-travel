"use client";

import Button from "./Button";

export default function LoadMore({
  shown,
  total,
  onLoadMore,
  noun = "results",
}: {
  shown: number;
  total: number;
  onLoadMore: () => void;
  noun?: string;
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-sm text-slate-500" aria-live="polite">
        Showing {shown} of {total} {noun}
      </p>
      {shown < total ? (
        <Button variant="outline" onClick={onLoadMore}>
          Load more
        </Button>
      ) : null}
    </div>
  );
}
