/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { CloseDate } from "../API.ts";
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
export declare type CloseDateUpdateFormInputValues = {
    closeDate?: string;
    startDate?: string;
    endDate?: string;
};
export declare type CloseDateUpdateFormValidationValues = {
    closeDate?: ValidationFunction<string>;
    startDate?: ValidationFunction<string>;
    endDate?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CloseDateUpdateFormOverridesProps = {
    CloseDateUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    closeDate?: PrimitiveOverrideProps<TextFieldProps>;
    startDate?: PrimitiveOverrideProps<TextFieldProps>;
    endDate?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CloseDateUpdateFormProps = React.PropsWithChildren<{
    overrides?: CloseDateUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    closeDate?: CloseDate;
    onSubmit?: (fields: CloseDateUpdateFormInputValues) => CloseDateUpdateFormInputValues;
    onSuccess?: (fields: CloseDateUpdateFormInputValues) => void;
    onError?: (fields: CloseDateUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CloseDateUpdateFormInputValues) => CloseDateUpdateFormInputValues;
    onValidate?: CloseDateUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CloseDateUpdateForm(props: CloseDateUpdateFormProps): React.ReactElement;
