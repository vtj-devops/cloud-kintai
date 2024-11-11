/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { HolidayCalendar } from "../API.ts";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type HolidayCalendarUpdateFormInputValues = {
    holidayDate?: string;
    name?: string;
};
export declare type HolidayCalendarUpdateFormValidationValues = {
    holidayDate?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type HolidayCalendarUpdateFormOverridesProps = {
    HolidayCalendarUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    holidayDate?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type HolidayCalendarUpdateFormProps = React.PropsWithChildren<{
    overrides?: HolidayCalendarUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    holidayCalendar?: HolidayCalendar;
    onSubmit?: (fields: HolidayCalendarUpdateFormInputValues) => HolidayCalendarUpdateFormInputValues;
    onSuccess?: (fields: HolidayCalendarUpdateFormInputValues) => void;
    onError?: (fields: HolidayCalendarUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: HolidayCalendarUpdateFormInputValues) => HolidayCalendarUpdateFormInputValues;
    onValidate?: HolidayCalendarUpdateFormValidationValues;
} & React.CSSProperties>;
export default function HolidayCalendarUpdateForm(props: HolidayCalendarUpdateFormProps): React.ReactElement;
