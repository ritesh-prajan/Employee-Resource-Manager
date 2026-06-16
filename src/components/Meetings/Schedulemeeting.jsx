import { useState } from "react";
import { CirclePlus } from "lucide-react";
export default function Schedulemeeting() {
  const [open, setOpen] = useState(false);

  return (
    <>
     
      <div
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-xl p-6 shadow-sm hover:shadow-md transition"
      >
        <div className="flex items-center gap-3">
          
        <CirclePlus/>
          <h2 className="font-semibold ">
            Schedule Meeting
          </h2>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          {/* Prevent close when clicking inside modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl text-blue-600">+</span>
                <h2 className="text-2xl font-semibold">
                  Schedule Meeting
                </h2>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="mb-2 block font-medium">
                  Title
                </label>
                <input
                  className="w-full rounded-lg border p-3"
                  placeholder="Meeting topic..."
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border p-3"
                  placeholder="Agenda..."
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Meeting Link (URL)
                </label>
                <input
                  className="w-full rounded-lg border p-3"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-medium">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Duration
                  </label>
                  <select className="w-full rounded-lg border p-3">
                    <option>15 mins</option>
                    <option>30 mins</option>
                    <option>45 mins</option>
                    <option>60 mins</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border px-5 py-2"
                >
                  Cancel
                </button>

                <button className="rounded-lg bg-blue-600 px-5 py-2 text-white">
                  Create Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}