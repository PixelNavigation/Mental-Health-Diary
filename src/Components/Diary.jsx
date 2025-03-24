import { useEffect, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs from 'dayjs';
import './Diary.css';

const Diary = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [diaryEntry, setDiaryEntry] = useState('');
    const [savedEntries, setSavedEntry] = useState({});

    useEffect(() => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        if (savedEntries[dateKey]) {
            setDiaryEntry(savedEntries[dateKey]);
        } else {
            setDiaryEntry('');
        }
    }, [selectedDate, savedEntries]);

    const HandleSave = () => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        setSavedEntry({
            ...savedEntries,
            [dateKey]: diaryEntry,
        });
        alert('Diary Saved')
    };

    return (
        <div className="Diary">
            <div className='DatePicker'>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <StaticDatePicker
                        maxDate={dayjs()}
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        slots={{
                            actionBar: () => null,
                        }}
                    />
                </LocalizationProvider>
            </div>
            <div className='DiaryContent'>
                <h1>Today is {selectedDate.format('dddd, MMMM D, YYYY')}</h1>
                <textarea
                    rows='10'
                    cols='100'
                    value={diaryEntry}
                    onChange={(e) => setDiaryEntry(e.target.value)}
                ></textarea>
                <button onClick={HandleSave}>Save</button>
            </div>
        </div>
    )
}

export default Diary