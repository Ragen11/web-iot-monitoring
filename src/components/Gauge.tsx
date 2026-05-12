import { useEffect, useState } from "react";

type Props = {
  onDetailClick: () => void;
};

export default function Gauge({
  onDetailClick,
}: Props) {

  const targetValue = 96;
  const [value, setValue] = useState(0);

  // SMOOTH ANIMATION
  useEffect(() => {

    let start = 0;

    const duration = 1000;
    const stepTime = 10;
    const steps = duration / stepTime;
    const increment = targetValue / steps;

    const interval = setInterval(() => {

      start += increment;

      if (start >= targetValue) {
        start = targetValue;
        clearInterval(interval);
      }

      setValue(Math.round(start));

    }, stepTime);

    return () => clearInterval(interval);

  }, []);

  // GAUGE CONFIG
  const radius = 80;
  const stroke = 14;

  const normalizedRadius = radius - stroke / 2;
  const circumference = Math.PI * normalizedRadius;

  const progress = (value / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <h2 className="text-gray-800 font-semibold text-lg">
          Kehadiran Dosen
        </h2>

        {/* RANGE */}
        <div className="flex gap-2 bg-gray-100 rounded-lg px-2 py-1 text-xs">

          <span className="bg-white px-2 py-1 rounded-md shadow text-black font-medium">
            1H
          </span>

          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:text-black transition">
            1M
          </span>

          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:text-black transition">
            1B
          </span>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-3 text-sm text-gray-500 mb-4">

        <select className="bg-transparent outline-none cursor-pointer">
          <option>RER</option>
        </select>

        <select className="bg-transparent outline-none cursor-pointer">
          <option>TK-46-06</option>
        </select>
      </div>

      {/* GAUGE */}
      <div className="flex flex-col items-center justify-center relative">

        <svg height={120} width={200}>

          {/* BACKGROUND */}
          <path
            d="
              M 10 100
              A 90 90 0 0 1 190 100
            "
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* PROGRESS */}
          <path
            d="
              M 10 100
              A 90 90 0 0 1 190 100
            "
            fill="none"
            stroke="#9F4A4A"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{
              transition: "stroke-dashoffset 0.3s ease-out",
            }}
          />
        </svg>

        {/* VALUE */}
        <div className="absolute top-10 text-4xl font-bold text-gray-700">
          {value}%
        </div>

        {/* LABEL */}
        <div className="relative w-[200px] mt-2 text-sm text-gray-500">

          <span className="absolute left-[10px]">
            0%
          </span>

          <span className="absolute right-[10px]">
            100%
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end pr-2 mt-4">

        <button
          onClick={onDetailClick}
          className="
            text-[#9F4A4A]
            text-sm
            font-semibold
            cursor-pointer
            hover:underline
            transition
          "
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}