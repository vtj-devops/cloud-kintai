/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type AttendanceCreateFormInputValues = {
    staffId?: string;
    workDate?: string;
    startTime?: string;
    endTime?: string;
    goDirectlyFlag?: boolean;
    returnDirectlyFlag?: boolean;
    remarks?: string;
    paidHolidayFlag?: boolean;
    substituteHolidayDate?: string;
    revision?: number;
};
export declare type AttendanceCreateFormValidationValues = {
    staffId?: ValidationFunction<string>;
    workDate?: ValidationFunction<string>;
    startTime?: ValidationFunction<string>;
    endTime?: ValidationFunction<string>;
    goDirectlyFlag?: ValidationFunction<boolean>;
    returnDirectlyFlag?: ValidationFunction<boolean>;
    remarks?: ValidationFunction<string>;
    paidHolidayFlag?: ValidationFunction<boolean>;
    substituteHolidayDate?: ValidationFunction<string>;
    revision?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AttendanceCreateFormOverridesProps = {
    AttendanceCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    staffId?: PrimitiveOverrideProps<TextFieldProps>;
    workDate?: PrimitiveOverrideProps<TextFieldProps>;
    startTime?: PrimitiveOverrideProps<TextFieldProps>;
    endTime?: PrimitiveOverrideProps<TextFieldProps>;
    goDirectlyFlag?: PrimitiveOverrideProps<SwitchFieldProps>;
    returnDirectlyFlag?: PrimitiveOverrideProps<SwitchFieldProps>;
    remarks?: PrimitiveOverrideProps<TextFieldProps>;
    paidHolidayFlag?: PrimitiveOverrideProps<SwitchFieldProps>;
    substituteHolidayDate?: PrimitiveOverrideProps<TextFieldProps>;
    revision?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AttendanceCreateFormProps = React.PropsWithChildren<{
    overrides?: AttendanceCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AttendanceCreateFormInputValues) => AttendanceCreateFormInputValues;
    onSuccess?: (fields: AttendanceCreateFormInputValues) => void;
    onError?: (fields: AttendanceCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AttendanceCreateFormInputValues) => AttendanceCreateFormInputValues;
    onValidate?: AttendanceCreateFormValidationValues;
} & React.CSSProperties>;
export default function AttendanceCreateForm(props: AttendanceCreateFormProps): React.ReactElement;
