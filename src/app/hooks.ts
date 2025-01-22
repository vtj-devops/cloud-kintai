import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "./store";

export const useAppDispatchV2 = () => useDispatch<AppDispatch>();
export const useAppSelectorV2: TypedUseSelectorHook<RootState> = useSelector;
