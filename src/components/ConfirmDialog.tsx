import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: Props) {
  const confirmColor =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-yellow-500 hover:bg-yellow-600 text-white";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-gray-800 text-base mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm rounded-xl transition ${confirmColor}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
