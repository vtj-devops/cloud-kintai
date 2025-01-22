/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type CompanyHolidayCalendarCreateFormInputValues = {
    holidayDate?: string;
    name?: string;
};
export declare type CompanyHolidayCalendarCreateFormValidationValues = {
    holidayDate?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CompanyHolidayCalendarCreateFormOverridesProps = {
    CompanyHolidayCalendarCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    holidayDate?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CompanyHolidayCalendarCreateFormProps = React.PropsWithChildren<{
    overrides?: CompanyHolidayCalendarCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CompanyHolidayCalendarCreateFormInputValues) => CompanyHolidayCalendarCreateFormInputValues;
    onSuccess?: (fields: CompanyHolidayCalendarCreateFormInputValues) => void;
    onError?: (fields: CompanyHolidayCalendarCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CompanyHolidayCalendarCreateFormInputValues) => CompanyHolidayCalendarCreateFormInputValues;
    onValidate?: CompanyHolidayCalendarCreateFormValidationValues;
} & React.CSSProperties>;
export default function CompanyHolidayCalendarCreateForm(props: CompanyHolidayCalendarCreateFormProps): React.ReactElement;
