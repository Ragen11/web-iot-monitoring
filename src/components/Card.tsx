type Props = {
  title: string;
  value: string;
};

export default function Card({ title, value }: Props) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
      <p className="text-green-500 text-sm font-medium">+11.01%</p>
    </div>
  );
}