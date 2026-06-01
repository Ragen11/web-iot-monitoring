type Props = {
  open: boolean;
  countdown: number;
  onStay: () => void;
};

export default function SessionTimeoutModal({
  open,
  countdown,
  onStay,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-2xl p-6 shadow-2xl">
        
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Session Akan Berakhir
        </h2>

        <p className="text-gray-600 mb-6">
          Anda tidak aktif selama beberapa menit.
          <br />
          Harap login kembali.
        </p>

        <div className="text-center text-3xl font-bold text-primary mb-6">
          {countdown}
        </div>

        <button
          onClick={onStay}
          className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90"
        >
          Tetap Login
        </button>
      </div>
    </div>
  );
}