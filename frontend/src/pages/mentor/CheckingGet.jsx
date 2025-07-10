import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';

const CheckingList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axiosInstance.get('mentorship/checking-list/')
      .then(res => {
        setItems(res.data);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="border p-3 my-2">
          <p><strong>Message:</strong> {item.message}</p>
          
          {item.video && (
            <video width="320" height="240" controls>
              <source src={`https://res.cloudinary.com/dd8w3mruv/video/upload/${item.video}.mp4`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {item.audio && (
            <audio controls>
              <source src={`https://res.cloudinary.com/dd8w3mruv/video/upload/${item.audio}.mp3`} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      ))}
    </div>
  );
};

export default CheckingList;
