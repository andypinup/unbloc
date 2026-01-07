import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Filter } from 'lucide-react'

function Diary() {
  const navigate = useNavigate()
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])
  const [engineers, setEngineers] = useState([])
  const [selectedEngineer, setSelectedEngineer] = useState('')
  const [view, setView] = useState('timeGridWeek')

  useEffect(() => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => setEngineers(data.filter(e => e.active)))
  }, [])

  const fetchEvents = (fetchInfo) => {
    const start = fetchInfo.startStr.split('T')[0]
    const end = fetchInfo.endStr.split('T')[0]

    fetch(`/api/calendar?start=${start}&end=${end}`)
      .then(res => res.json())
      .then(data => {
        let filtered = data
        if (selectedEngineer) {
          filtered = data.filter(e => e.extendedProps.engineer === selectedEngineer)
        }
        setEvents(filtered)
      })
  }

  const handleEventClick = (info) => {
    navigate(`/jobs/${info.event.id}`)
  }

  const handleDateClick = (info) => {
    // Could open a new job modal with the date pre-filled
    console.log('Date clicked:', info.dateStr)
  }

  const handleViewChange = (newView) => {
    setView(newView)
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.changeView(newView)
    }
  }

  const handleEngineerFilter = (engineerName) => {
    setSelectedEngineer(engineerName)
    // Trigger a refetch
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.refetchEvents()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Diary</h1>
        <div className="flex items-center gap-4">
          {/* Engineer Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedEngineer}
              onChange={e => handleEngineerFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="">All Engineers</option>
              {engineers.map(e => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* View Switcher */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-4 py-2 text-sm ${
                view === 'dayGridMonth' ? 'bg-unbloc-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-4 py-2 text-sm border-l ${
                view === 'timeGridWeek' ? 'bg-unbloc-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-4 py-2 text-sm border-l ${
                view === 'timeGridDay' ? 'bg-unbloc-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">Status:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></span>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Cancelled</span>
          </div>

          {engineers.length > 0 && (
            <>
              <span className="ml-4 font-medium text-gray-700">Engineers:</span>
              {engineers.map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }}></span>
                  <span>{e.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={fetchEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          weekends={true}
          nowIndicator={true}
          eventDisplay="block"
          eventContent={renderEventContent}
        />
      </div>
    </div>
  )
}

function renderEventContent(eventInfo) {
  const { extendedProps } = eventInfo.event

  return (
    <div className="p-1 overflow-hidden">
      <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
      {extendedProps.engineer && (
        <div className="text-xs opacity-80 truncate">{extendedProps.engineer}</div>
      )}
      {extendedProps.postcode && (
        <div className="text-xs opacity-80 truncate">{extendedProps.postcode}</div>
      )}
    </div>
  )
}

export default Diary
