import React, { createContext, useContext } from 'react';

const SocketContext = createContext();

export function SocketProvider({ children, value }) {
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export { SocketContext };
