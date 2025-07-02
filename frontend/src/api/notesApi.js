import axiosInstance from '../axios';



export const getQuestionsByTopic = async (topicId) => {
  const res = await axiosInstance.get(`topics/questions/?main_topic=${topicId}`);
  return res.data;
};

export const postQuestion = async (topicId, data) => {
  return (await axiosInstance.post('topics/questions/', { ...data, main_topic: topicId })).data;
};


export const updateQuestion = async (id, data) => {
  return (await axiosInstance.put(`topics/questions/${id}/`, data)).data;
};


export const deleteQuestion = async (id) => {
  return await axiosInstance.delete(`topics/questions/${id}/`);
};

export const generateAiAnswer = async (questionText) => {
  const res = await axiosInstance.post('topics/generate-ai-answer/', { question_text: questionText });
  return res.data;
};

export const postAnswer = async (questionId, answer_text) => {
  return (await axiosInstance.post('topics/answers/', { question: questionId, answer_text })).data;
};

export const updateAnswer = async (id, data) => {
  return (await axiosInstance.put(`topics/answers/${id}/`, data)).data;
};
export const deleteAnswer = async (id) => {
  return await axiosInstance.delete(`topics/answers/${id}/`);
};
