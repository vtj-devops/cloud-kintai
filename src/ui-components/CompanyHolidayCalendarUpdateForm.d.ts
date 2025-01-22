/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { CompanyHolidayCalendar } from "../API.ts";
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
export declare type CompanyHolidayCalendarUpdateFormInputValues = {
    holidayDate?: string;
    name?: string;
};
export declare type CompanyHolidayCalendarUpdateFormValidationValues = {
    holidayDate?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CompanyHolidayCalendarUpdateFormOverridesProps = {
    CompanyHolidayCalendarUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    holidayDate?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CompanyHolidayCalendarUpdateFormProps = React.PropsWithChildren<{
    overrides?: CompanyHolidayCalendarUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    companyHolidayCalendar?: CompanyHolidayCalendar;
    onSubmit?: (fields: CompanyHolidayCalendarUpdateFormInputValues) => CompanyHolidayCalendarUpdateFormInputValues;
    onSuccess?: (fields: CompanyHolidayCalendarUpdateFormInputValues) => void;
    onError?: (fields: CompanyHolidayCalendarUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CompanyHolidayCalendarUpdateFormInputValues) => CompanyHolidayCalendarUpdateFormInputValues;
    onValidate?: CompanyHolidayCalendarUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CompanyHolidayCalendarUpdateForm(props: CompanyHolidayCalendarUpdateFormProps): React.ReactElement;
