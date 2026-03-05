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
export declare type WorkflowTemplateCreateFormInputValues = {
    name?: string;
    title?: string;
    content?: string;
    organizationId?: string;
};
export declare type WorkflowTemplateCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    content?: ValidationFunction<string>;
    organizationId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WorkflowTemplateCreateFormOverridesProps = {
    WorkflowTemplateCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    content?: PrimitiveOverrideProps<TextFieldProps>;
    organizationId?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WorkflowTemplateCreateFormProps = React.PropsWithChildren<{
    overrides?: WorkflowTemplateCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: WorkflowTemplateCreateFormInputValues) => WorkflowTemplateCreateFormInputValues;
    onSuccess?: (fields: WorkflowTemplateCreateFormInputValues) => void;
    onError?: (fields: WorkflowTemplateCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WorkflowTemplateCreateFormInputValues) => WorkflowTemplateCreateFormInputValues;
    onValidate?: WorkflowTemplateCreateFormValidationValues;
} & React.CSSProperties>;
export default function WorkflowTemplateCreateForm(props: WorkflowTemplateCreateFormProps): React.ReactElement;
