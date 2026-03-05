/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Staff } from "../shared/api/graphql/types.ts";
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
export declare type StaffUpdateFormInputValues = {
    cognitoUserId?: string;
    familyName?: string;
    givenName?: string;
    mailAddress?: string;
    role?: string;
    enabled?: boolean;
    status?: string;
    owner?: boolean;
    usageStartDate?: string;
    sortKey?: string;
    workType?: string;
    developer?: boolean;
    approverSetting?: string;
    approverSingle?: string;
    approverMultiple?: string[];
    approverMultipleMode?: string;
    shiftGroup?: string;
    attendanceManagementEnabled?: boolean;
};
export declare type StaffUpdateFormValidationValues = {
    cognitoUserId?: ValidationFunction<string>;
    familyName?: ValidationFunction<string>;
    givenName?: ValidationFunction<string>;
    mailAddress?: ValidationFunction<string>;
    role?: ValidationFunction<string>;
    enabled?: ValidationFunction<boolean>;
    status?: ValidationFunction<string>;
    owner?: ValidationFunction<boolean>;
    usageStartDate?: ValidationFunction<string>;
    sortKey?: ValidationFunction<string>;
    workType?: ValidationFunction<string>;
    developer?: ValidationFunction<boolean>;
    approverSetting?: ValidationFunction<string>;
    approverSingle?: ValidationFunction<string>;
    approverMultiple?: ValidationFunction<string>;
    approverMultipleMode?: ValidationFunction<string>;
    shiftGroup?: ValidationFunction<string>;
    attendanceManagementEnabled?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type StaffUpdateFormOverridesProps = {
    StaffUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    cognitoUserId?: PrimitiveOverrideProps<TextFieldProps>;
    familyName?: PrimitiveOverrideProps<TextFieldProps>;
    givenName?: PrimitiveOverrideProps<TextFieldProps>;
    mailAddress?: PrimitiveOverrideProps<TextFieldProps>;
    role?: PrimitiveOverrideProps<TextFieldProps>;
    enabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<SwitchFieldProps>;
    usageStartDate?: PrimitiveOverrideProps<TextFieldProps>;
    sortKey?: PrimitiveOverrideProps<TextFieldProps>;
    workType?: PrimitiveOverrideProps<TextFieldProps>;
    developer?: PrimitiveOverrideProps<SwitchFieldProps>;
    approverSetting?: PrimitiveOverrideProps<SelectFieldProps>;
    approverSingle?: PrimitiveOverrideProps<TextFieldProps>;
    approverMultiple?: PrimitiveOverrideProps<TextFieldProps>;
    approverMultipleMode?: PrimitiveOverrideProps<SelectFieldProps>;
    shiftGroup?: PrimitiveOverrideProps<TextFieldProps>;
    attendanceManagementEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type StaffUpdateFormProps = React.PropsWithChildren<{
    overrides?: StaffUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    staff?: Staff;
    onSubmit?: (fields: StaffUpdateFormInputValues) => StaffUpdateFormInputValues;
    onSuccess?: (fields: StaffUpdateFormInputValues) => void;
    onError?: (fields: StaffUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: StaffUpdateFormInputValues) => StaffUpdateFormInputValues;
    onValidate?: StaffUpdateFormValidationValues;
} & React.CSSProperties>;
export default function StaffUpdateForm(props: StaffUpdateFormProps): React.ReactElement;
