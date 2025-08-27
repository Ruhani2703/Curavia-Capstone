import { useParams as useReactRouterParams } from 'react-router-dom';

export function useParams() {
  return useReactRouterParams();
}