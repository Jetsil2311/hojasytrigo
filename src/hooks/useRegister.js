import { useRegisterContext } from '../context/RegisterContext';

export const useRegister = () => {
  const { isRegisterOpen, openRegister, closeRegister, loading } = useRegisterContext();
  return { isRegisterOpen, openRegister, closeRegister, loading };
};
