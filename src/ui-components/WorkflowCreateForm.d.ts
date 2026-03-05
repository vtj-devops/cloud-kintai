/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type WorkflowCreateFormInputValues = {
    approvedStaffIds?: string[];
    rejectedStaffIds?: string[];
    finalDecisionTimestamp?: string;
    category?: string;
    customWorkflowTitle?: string;
    customWorkflowContent?: string;
    staffId?: string;
    status?: string;
    assignedApproverStaffIds?: string[];
    nextApprovalStepIndex?: number;
    submitterApproverSetting?: string;
    submitterApproverId?: string;
    submitterApproverIds?: string[];
    submitterApproverMultipleMode?: string;
};
export declare type WorkflowCreateFormValidationValues = {
    approvedStaffIds?: ValidationFunction<string>;
    rejectedStaffIds?: ValidationFunction<string>;
    finalDecisionTimestamp?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    customWorkflowTitle?: ValidationFunction<string>;
    customWorkflowContent?: ValidationFunction<string>;
    staffId?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    assignedApproverStaffIds?: ValidationFunction<string>;
    nextApprovalStepIndex?: ValidationFunction<number>;
    submitterApproverSetting?: ValidationFunction<string>;
    submitterApproverId?: ValidationFunction<string>;
    submitterApproverIds?: ValidationFunction<string>;
    submitterApproverMultipleMode?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WorkflowCreateFormOverridesProps = {
    WorkflowCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    approvedStaffIds?: PrimitiveOverrideProps<TextFieldProps>;
    rejectedStaffIds?: PrimitiveOverrideProps<TextFieldProps>;
    finalDecisionTimestamp?: PrimitiveOverrideProps<TextFieldProps>;
    category?: PrimitiveOverrideProps<SelectFieldProps>;
    customWorkflowTitle?: PrimitiveOverrideProps<TextFieldProps>;
    customWorkflowContent?: PrimitiveOverrideProps<TextFieldProps>;
    staffId?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    assignedApproverStaffIds?: PrimitiveOverrideProps<TextFieldProps>;
    nextApprovalStepIndex?: PrimitiveOverrideProps<TextFieldProps>;
    submitterApproverSetting?: PrimitiveOverrideProps<SelectFieldProps>;
    submitterApproverId?: PrimitiveOverrideProps<TextFieldProps>;
    submitterApproverIds?: PrimitiveOverrideProps<TextFieldProps>;
    submitterApproverMultipleMode?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type WorkflowCreateFormProps = React.PropsWithChildren<{
    overrides?: WorkflowCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: WorkflowCreateFormInputValues) => WorkflowCreateFormInputValues;
    onSuccess?: (fields: WorkflowCreateFormInputValues) => void;
    onError?: (fields: WorkflowCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WorkflowCreateFormInputValues) => WorkflowCreateFormInputValues;
    onValidate?: WorkflowCreateFormValidationValues;
} & React.CSSProperties>;
export default function WorkflowCreateForm(props: WorkflowCreateFormProps): React.ReactElement;
