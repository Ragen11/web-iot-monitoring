import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarCard() {
  const [date, setDate] = useState(new Date());

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <h2 className="text-gray-700 font-semibold mb-3">Calendar</h2>

      <Calendar
        onChange={(value) => setDate(value as Date)}
        value={date}
        className="border-none w-full"
      />

      <p className="text-sm text-gray-500 mt-3">
        Selected: {date.toDateString()}
      </p>
    </div>
  );
}