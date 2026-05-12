
import type { ReactNode } from "react";
type Props = {
  title: string;
  value: string;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
};

export default function Card({ title, value, icon, iconBg, iconColor }: Props) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={`text-lg ${iconColor}`}>
            {icon}
          </span>
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
        </div>
      </div>
    </div>
  );
}