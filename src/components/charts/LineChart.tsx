import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "1", ceramah: 60, diskusi: 70, tanya: 50 },
  { name: "2", ceramah: 80, diskusi: 60, tanya: 75 },
  { name: "3", ceramah: 30, diskusi: 90, tanya: 100 },
  { name: "4", ceramah: 40, diskusi: 20, tanya: 25 },
  { name: "5", ceramah: 35, diskusi: 30, tanya: 15 },
  { name: "6", ceramah: 75, diskusi: 70, tanya: 40 },
  { name: "7", ceramah: 80, diskusi: 75, tanya: 90 },
];

export default function ChartLine() {
  return (
    <div className="bg-white p-5 rounded-xl shadow h-80">
      <h2 className="font-semibold mb-4">Tren Interaksi Pembelajaran</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="ceramah" stroke="#8884d8" />
          <Line type="monotone" dataKey="diskusi" stroke="#82ca9d" />
          <Line type="monotone" dataKey="tanya" stroke="#f87171" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}