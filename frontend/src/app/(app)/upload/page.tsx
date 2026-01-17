export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold leading-8 text-[var(--foreground)]">
        Upload Screenshot
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-6 text-sm leading-6 text-[var(--muted-foreground)]">
        Drag & drop a screenshot here, or click to choose a file.
      </div>
      <button
        type="button"
        className="h-12 rounded-full bg-black px-5 text-sm font-bold leading-5 text-white"
      >
        Submit
      </button>
    </div>
  );
}

