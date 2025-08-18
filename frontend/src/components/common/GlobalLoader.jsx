// src/components/common/GlobalLoader.js
// import { useSelector } from 'react-redux';
// import { Spin } from 'antd';

// const GlobalLoader = () => {
//   const loading = useSelector(state => state.loader.loading);
//   if (!loading) return null;

//   return (
//     <div className="flex justify-center items-center py-4">
//       <Spin size="large" />
//     </div>
//   );
// };

// export default GlobalLoader;

//-------------------------------------------------------------------------------------------------------------------------
// FOR ROUND SPIN

// import { useSelector } from 'react-redux';
// import CircularProgress from '@mui/material/CircularProgress';

// const GlobalLoader = () => {
//   const loading = useSelector(state => state.loader.loading);
//   if (!loading) return null;

//   return (
//     <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
//       <CircularProgress color="primary" size={70} />
//     </div>
//   );
// };

// export default GlobalLoader;

//-------------------------------------------------------------------------------------------------------------------------

// import { useSelector } from 'react-redux';
// import { Loader } from '@mantine/core';

// const GlobalLoader = () => {
  //   const loading = useSelector(state => state.loader.loading);
  //   if (!loading) return null;
  
  //   return (
    //     <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
    //       <Loader size="xl" color="indigo" />
    //     </div>
    //   );
    // };
    
    // export default GlobalLoader;
    
    //-------------------------------------------------------------------------------------------------------------------------


import { useSelector } from 'react-redux';
import { FaSpinner } from 'react-icons/fa';

const GlobalLoader = () => {
  const loading = useSelector(state => state.loader.loading);
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-opacity-40 flex items-center justify-center">
      <FaSpinner className="animate-spin text-indigo-600" size={64} />
    </div>
  );
};

export default GlobalLoader;
