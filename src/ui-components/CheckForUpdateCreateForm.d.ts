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
export declare type CheckForUpdateCreateFormInputValues = {
    deployUuid?: string;
};
export declare type CheckForUpdateCreateFormValidationValues = {
    deployUuid?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CheckForUpdateCreateFormOverridesProps = {
    CheckForUpdateCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    deployUuid?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CheckForUpdateCreateFormProps = React.PropsWithChildren<{
    overrides?: CheckForUpdateCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CheckForUpdateCreateFormInputValues) => CheckForUpdateCreateFormInputValues;
    onSuccess?: (fields: CheckForUpdateCreateFormInputValues) => void;
    onError?: (fields: CheckForUpdateCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CheckForUpdateCreateFormInputValues) => CheckForUpdateCreateFormInputValues;
    onValidate?: CheckForUpdateCreateFormValidationValues;
} & React.CSSProperties>;
export default function CheckForUpdateCreateForm(props: CheckForUpdateCreateFormProps): React.ReactElement;
