/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { CheckForUpdate } from "../API.ts";
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
export declare type CheckForUpdateUpdateFormInputValues = {
    deployUuid?: string;
};
export declare type CheckForUpdateUpdateFormValidationValues = {
    deployUuid?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CheckForUpdateUpdateFormOverridesProps = {
    CheckForUpdateUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    deployUuid?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CheckForUpdateUpdateFormProps = React.PropsWithChildren<{
    overrides?: CheckForUpdateUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    checkForUpdate?: CheckForUpdate;
    onSubmit?: (fields: CheckForUpdateUpdateFormInputValues) => CheckForUpdateUpdateFormInputValues;
    onSuccess?: (fields: CheckForUpdateUpdateFormInputValues) => void;
    onError?: (fields: CheckForUpdateUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CheckForUpdateUpdateFormInputValues) => CheckForUpdateUpdateFormInputValues;
    onValidate?: CheckForUpdateUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CheckForUpdateUpdateForm(props: CheckForUpdateUpdateFormProps): React.ReactElement;
