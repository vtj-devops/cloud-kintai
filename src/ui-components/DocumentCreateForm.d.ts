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
export declare type DocumentCreateFormInputValues = {
    title?: string;
    content?: string;
    tag?: string[];
    targetRole?: string[];
    revision?: number;
};
export declare type DocumentCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    content?: ValidationFunction<string>;
    tag?: ValidationFunction<string>;
    targetRole?: ValidationFunction<string>;
    revision?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type DocumentCreateFormOverridesProps = {
    DocumentCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    content?: PrimitiveOverrideProps<TextFieldProps>;
    tag?: PrimitiveOverrideProps<TextFieldProps>;
    targetRole?: PrimitiveOverrideProps<TextFieldProps>;
    revision?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type DocumentCreateFormProps = React.PropsWithChildren<{
    overrides?: DocumentCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: DocumentCreateFormInputValues) => DocumentCreateFormInputValues;
    onSuccess?: (fields: DocumentCreateFormInputValues) => void;
    onError?: (fields: DocumentCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: DocumentCreateFormInputValues) => DocumentCreateFormInputValues;
    onValidate?: DocumentCreateFormValidationValues;
} & React.CSSProperties>;
export default function DocumentCreateForm(props: DocumentCreateFormProps): React.ReactElement;
