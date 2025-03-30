import { useEffect, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs from 'dayjs';
import './Diary.css';
import axios from 'axios';

const Diary = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [diaryEntry, setDiaryEntry] = useState('');
    const [savedEntries, setSavedEntry] = useState([]);

    useEffect(() => {
        const fetchDiaryEntries = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_diary');
                setSavedEntry(response.data);
                console.log("Successfully fetched ENTRIES");
            } catch (error) {
                console.error("Error fetching diary entries:", error);
            }
        };
        fetchDiaryEntries();
    }, []);


    useEffect(() => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const entry = savedEntries.find((entry) => entry.date === dateKey);
        if (entry) {
            setDiaryEntry(entry.content);
        } else {
            setDiaryEntry('');
        }
    }, [selectedDate, savedEntries]);

    const HandleSave = () => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        axios.post('http://localhost:5000/add_diary', {
            date: selectedDate.format('YYYY-MM-DD'),
            content: diaryEntry,
        }).then(() => {
            alert('Diary Saved')
            setSavedEntry((prevEntry) => {
                const Existing = prevEntry.findIndex((entry) => entry.date === dateKey);
                if (Existing !== -1) {
                    const updatedEntries = [...prevEntry];
                    updatedEntries[Existing].content = diaryEntry;
                    return updatedEntries;
                } else {
                    return [...prevEntry, { date: dateKey, content: diaryEntry }];
                }
            })
        });
    }

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