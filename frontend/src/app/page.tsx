export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-50 px-6 pb-20">
      <section className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Visual trip builder
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900 lg:text-4xl">
              Upload screenshots and get a smart itinerary in minutes.
            </h1>
            <p className="mt-4 text-sm text-gray-500">
              PlaceSnap detects locations from your images and builds a clean,
              swipeable plan powered by Gemini.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">
                Upload photos
              </button>
              <button className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-gray-700">
                Generate itinerary
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Photo 1", "Photo 2", "Photo 3", "Photo 4"].map((label) => (
                <div
                  key={label}
                  className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-black/10 bg-gray-50 text-xs text-gray-400"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold text-gray-900">
                Detected places
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Locations found in your screenshots.
              </p>
              <div className="mt-4 space-y-3">
                {["CN Tower", "Distillery District", "Harbourfront"].map(
                  (place) => (
                    <div
                      key={place}
                      className="flex items-center justify-between rounded-2xl border border-black/5 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                    >
                      <span>{place}</span>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs">
                        detected
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold text-gray-900">
                Gemini guidance
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Suggested flow and pacing for your day.
              </p>
              <div className="mt-4 rounded-2xl border border-black/5 bg-gray-50 p-4 text-sm text-gray-600">
                Golden hour at Harbourfront, lunch in Distillery District, end
                with skyline views.
              </div>
              <div className="mt-4 grid gap-3 text-xs text-gray-500 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 p-3">
                  <p className="text-gray-700">Transit</p>
                  <p>Walk + short rides</p>
                </div>
                <div className="rounded-2xl border border-black/5 p-3">
                  <p className="text-gray-700">Timing</p>
                  <p>Optimized for golden hour</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Swipe vibe</h2>
              <div className="flex gap-2 text-xs text-gray-500">
                <button className="rounded-full border border-black/10 px-3 py-1">
                  ◀
                </button>
                <button className="rounded-full border border-black/10 px-3 py-1">
                  ▶
                </button>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                "City Pulse",
                "Nature Reset",
                "Art + Culture"
              ].map((title, index) => (
                <div
                  key={title}
                  className={`rounded-3xl border border-black/5 p-5 ${
                    index === 0 ? "bg-gray-900 text-white" : "bg-gray-50"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    {index + 1} / 3
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Swipe to pick the vibe that matches your plan.
                  </p>
                  <div className="mt-4 flex gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Like
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Pass
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
              <span className="text-xs text-gray-500">4 stops</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["09:30 AM", "Coffee at Union Station"],
                ["11:00 AM", "Distillery District walk"],
                ["01:00 PM", "Lunch by the water"],
                ["03:00 PM", "CN Tower skyline photos"]
              ].map(([time, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-black/5 bg-gray-50 p-4 text-sm text-gray-700"
                >
                  <p className="text-xs text-gray-400">{time}</p>
                  <p className="mt-1 font-semibold text-gray-900">{label}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Gemini picked this timing for light + crowd balance.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
