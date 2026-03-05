/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { WorkflowTemplate } from "../shared/api/graphql/types.ts";
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
export declare type WorkflowTemplateUpdateFormInputValues = {
    name?: string;
    title?: string;
    content?: string;
    organizationId?: string;
};
export declare type WorkflowTemplateUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    content?: ValidationFunction<string>;
    organizationId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WorkflowTemplateUpdateFormOverridesProps = {
    WorkflowTemplateUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    content?: PrimitiveOverrideProps<TextFieldProps>;
    organizationId?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WorkflowTemplateUpdateFormProps = React.PropsWithChildren<{
    overrides?: WorkflowTemplateUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    workflowTemplate?: WorkflowTemplate;
    onSubmit?: (fields: WorkflowTemplateUpdateFormInputValues) => WorkflowTemplateUpdateFormInputValues;
    onSuccess?: (fields: WorkflowTemplateUpdateFormInputValues) => void;
    onError?: (fields: WorkflowTemplateUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WorkflowTemplateUpdateFormInputValues) => WorkflowTemplateUpdateFormInputValues;
    onValidate?: WorkflowTemplateUpdateFormValidationValues;
} & React.CSSProperties>;
export default function WorkflowTemplateUpdateForm(props: WorkflowTemplateUpdateFormProps): React.ReactElement;
