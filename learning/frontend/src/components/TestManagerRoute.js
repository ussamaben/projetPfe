import React, { useEffect, useState } from 'react';

const TestManagerRoute = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/manager/test')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage(data.message);
        } else {
          setMessage('Error from API');
        }
      })
      .catch(err => {
        setMessage('Error: ' + err.message);
      });
  }, []);

  return (
    <div>
      <h2>Manager Route Test</h2>
      <p>{message}</p>
    </div>
  );
};

export default TestManagerRoute;
