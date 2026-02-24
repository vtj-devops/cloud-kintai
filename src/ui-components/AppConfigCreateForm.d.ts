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
export declare type AppConfigCreateFormInputValues = {
    name?: string;
    workStartTime?: string;
    workEndTime?: string;
    lunchRestStartTime?: string;
    lunchRestEndTime?: string;
    standardWorkHours?: number;
    amHolidayStartTime?: string;
    amHolidayEndTime?: string;
    pmHolidayStartTime?: string;
    pmHolidayEndTime?: string;
    specialHolidayEnabled?: boolean;
    amPmHolidayEnabled?: boolean;
    officeMode?: boolean;
    attendanceStatisticsEnabled?: boolean;
    absentEnabled?: boolean;
    hourlyPaidHolidayEnabled?: boolean;
    themeColor?: string;
    overTimeCheckEnabled?: boolean;
};
export declare type AppConfigCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    workStartTime?: ValidationFunction<string>;
    workEndTime?: ValidationFunction<string>;
    lunchRestStartTime?: ValidationFunction<string>;
    lunchRestEndTime?: ValidationFunction<string>;
    standardWorkHours?: ValidationFunction<number>;
    amHolidayStartTime?: ValidationFunction<string>;
    amHolidayEndTime?: ValidationFunction<string>;
    pmHolidayStartTime?: ValidationFunction<string>;
    pmHolidayEndTime?: ValidationFunction<string>;
    specialHolidayEnabled?: ValidationFunction<boolean>;
    amPmHolidayEnabled?: ValidationFunction<boolean>;
    officeMode?: ValidationFunction<boolean>;
    attendanceStatisticsEnabled?: ValidationFunction<boolean>;
    absentEnabled?: ValidationFunction<boolean>;
    hourlyPaidHolidayEnabled?: ValidationFunction<boolean>;
    themeColor?: ValidationFunction<string>;
    overTimeCheckEnabled?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AppConfigCreateFormOverridesProps = {
    AppConfigCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    workStartTime?: PrimitiveOverrideProps<TextFieldProps>;
    workEndTime?: PrimitiveOverrideProps<TextFieldProps>;
    lunchRestStartTime?: PrimitiveOverrideProps<TextFieldProps>;
    lunchRestEndTime?: PrimitiveOverrideProps<TextFieldProps>;
    standardWorkHours?: PrimitiveOverrideProps<TextFieldProps>;
    amHolidayStartTime?: PrimitiveOverrideProps<TextFieldProps>;
    amHolidayEndTime?: PrimitiveOverrideProps<TextFieldProps>;
    pmHolidayStartTime?: PrimitiveOverrideProps<TextFieldProps>;
    pmHolidayEndTime?: PrimitiveOverrideProps<TextFieldProps>;
    specialHolidayEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    amPmHolidayEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    officeMode?: PrimitiveOverrideProps<SwitchFieldProps>;
    attendanceStatisticsEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    absentEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    hourlyPaidHolidayEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    themeColor?: PrimitiveOverrideProps<TextFieldProps>;
    overTimeCheckEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type AppConfigCreateFormProps = React.PropsWithChildren<{
    overrides?: AppConfigCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AppConfigCreateFormInputValues) => AppConfigCreateFormInputValues;
    onSuccess?: (fields: AppConfigCreateFormInputValues) => void;
    onError?: (fields: AppConfigCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AppConfigCreateFormInputValues) => AppConfigCreateFormInputValues;
    onValidate?: AppConfigCreateFormValidationValues;
} & React.CSSProperties>;
export default function AppConfigCreateForm(props: AppConfigCreateFormProps): React.ReactElement;
