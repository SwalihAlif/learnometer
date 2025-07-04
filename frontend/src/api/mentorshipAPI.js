import axiosInstance from '../axios';

export const fetchMentors = () => axiosInstance.get("mentorship/mentors/");


export const bookSession = (mentorId, date, start_time, end_time) => {
  return axiosInstance.post(`/mentorship/session-bookings/`, {
    mentor: mentorId,
    date,
    start_time,
    end_time,
  });
};



export const getMentorSlots = () => axiosInstance.get('mentorship/availability/');
export const createMentorSlot = (data) => axiosInstance.post('mentorship/availability/', data);
export const updateMentorSlot = (id, data) => axiosInstance.put(`mentorship/availability/${id}/`, data);
export const deleteMentorSlot = (id) => axiosInstance.delete(`mentorship/availability/${id}/`);
