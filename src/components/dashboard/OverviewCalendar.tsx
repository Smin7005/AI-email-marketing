'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function OverviewCalendar() {
  const [value, setValue] = useState<Value>(new Date());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Calendar</h3>
      <div className="calendar-container">
        <Calendar
          value={value}
          onChange={setValue}
          showNeighboringMonth={true}
          locale="en-GB"
          calendarType="iso8601"
          tileClassName={({ date, view }) => {
            if (view === 'month') {
              // Highlight today
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              if (isToday) {
                return 'react-calendar__tile--active';
              }
            }
            return '';
          }}
        />
      </div>
      
      <style jsx global>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
          height: 40px;
        }
        
        .calendar-container .react-calendar__navigation button {
          min-width: 40px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }
        
        .calendar-container .react-calendar__navigation button:hover {
          background-color: #f3f4f6;
        }
        
        .calendar-container .react-calendar__navigation button:disabled {
          background-color: #f9fafb;
        }
        
        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 500;
          font-size: 11px;
          color: #6b7280;
          padding: 0.5rem 0;
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }
        
        .calendar-container .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        .calendar-container .react-calendar__tile {
          max-width: 100%;
          padding: 12px 6px;
          background: none;
          border: none;
          text-align: center;
          line-height: 16px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          position: relative;
        }
        
        .calendar-container .react-calendar__tile:hover {
          background-color: #f3f4f6;
          border-radius: 6px;
        }
        
        .calendar-container .react-calendar__tile--active {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 50%;
          font-weight: 600;
        }
        
        .calendar-container .react-calendar__tile--active:hover {
          background-color: #2563eb !important;
        }
        
        .calendar-container .react-calendar__month-view__days__day--weekend {
          color: #6b7280;
        }
        
        .calendar-container .react-calendar__month-view__days__day--neighboringMonth {
          color: #d1d5db;
        }
        
        .calendar-container .react-calendar__month-view__days__day--hidden {
          visibility: hidden;
        }
      `}</style>
    </div>
  );
}
