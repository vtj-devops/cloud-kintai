/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Attendance } from "../API.ts";
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
export declare type AttendanceUpdateFormInputValues = {
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
export declare type AttendanceUpdateFormValidationValues = {
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
export declare type AttendanceUpdateFormOverridesProps = {
    AttendanceUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
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
export declare type AttendanceUpdateFormProps = React.PropsWithChildren<{
    overrides?: AttendanceUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    attendance?: Attendance;
    onSubmit?: (fields: AttendanceUpdateFormInputValues) => AttendanceUpdateFormInputValues;
    onSuccess?: (fields: AttendanceUpdateFormInputValues) => void;
    onError?: (fields: AttendanceUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AttendanceUpdateFormInputValues) => AttendanceUpdateFormInputValues;
    onValidate?: AttendanceUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AttendanceUpdateForm(props: AttendanceUpdateFormProps): React.ReactElement;
