import React, { createContext, useContext, useState } from "react";

const CreatePostModalContext = createContext();

export const useCreatePostModal = () => {
  const context = useContext(CreatePostModalContext);
  if (!context) {
    return { isOpen: false, openModal: () => {}, closeModal: () => {} };
  }
  return context;
};

export const CreatePostModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <CreatePostModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </CreatePostModalContext.Provider>
  );
};
