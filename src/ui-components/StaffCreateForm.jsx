/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SwitchField,
  TextField,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { createStaff } from "../graphql/mutations";
export default function StaffCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    cognitoUserId: "",
    familyName: "",
    givenName: "",
    mailAddress: "",
    role: "",
    enabled: false,
    status: "",
    owner: false,
    usageStartDate: "",
    sortKey: "",
  };
  const [cognitoUserId, setCognitoUserId] = React.useState(
    initialValues.cognitoUserId
  );
  const [familyName, setFamilyName] = React.useState(initialValues.familyName);
  const [givenName, setGivenName] = React.useState(initialValues.givenName);
  const [mailAddress, setMailAddress] = React.useState(
    initialValues.mailAddress
  );
  const [role, setRole] = React.useState(initialValues.role);
  const [enabled, setEnabled] = React.useState(initialValues.enabled);
  const [status, setStatus] = React.useState(initialValues.status);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [usageStartDate, setUsageStartDate] = React.useState(
    initialValues.usageStartDate
  );
  const [sortKey, setSortKey] = React.useState(initialValues.sortKey);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setCognitoUserId(initialValues.cognitoUserId);
    setFamilyName(initialValues.familyName);
    setGivenName(initialValues.givenName);
    setMailAddress(initialValues.mailAddress);
    setRole(initialValues.role);
    setEnabled(initialValues.enabled);
    setStatus(initialValues.status);
    setOwner(initialValues.owner);
    setUsageStartDate(initialValues.usageStartDate);
    setSortKey(initialValues.sortKey);
    setErrors({});
  };
  const validations = {
    cognitoUserId: [{ type: "Required" }],
    familyName: [],
    givenName: [],
    mailAddress: [{ type: "Required" }],
    role: [{ type: "Required" }],
    enabled: [{ type: "Required" }],
    status: [{ type: "Required" }],
    owner: [],
    usageStartDate: [],
    sortKey: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          cognitoUserId,
          familyName,
          givenName,
          mailAddress,
          role,
          enabled,
          status,
          owner,
          usageStartDate,
          sortKey,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await API.graphql({
            query: createStaff.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "StaffCreateForm")}
      {...rest}
    >
      <TextField
        label="Cognito user id"
        isRequired={true}
        isReadOnly={false}
        value={cognitoUserId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId: value,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.cognitoUserId ?? value;
          }
          if (errors.cognitoUserId?.hasError) {
            runValidationTasks("cognitoUserId", value);
          }
          setCognitoUserId(value);
        }}
        onBlur={() => runValidationTasks("cognitoUserId", cognitoUserId)}
        errorMessage={errors.cognitoUserId?.errorMessage}
        hasError={errors.cognitoUserId?.hasError}
        {...getOverrideProps(overrides, "cognitoUserId")}
      ></TextField>
      <TextField
        label="Family name"
        isRequired={false}
        isReadOnly={false}
        value={familyName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName: value,
              givenName,
              mailAddress,
              role,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.familyName ?? value;
          }
          if (errors.familyName?.hasError) {
            runValidationTasks("familyName", value);
          }
          setFamilyName(value);
        }}
        onBlur={() => runValidationTasks("familyName", familyName)}
        errorMessage={errors.familyName?.errorMessage}
        hasError={errors.familyName?.hasError}
        {...getOverrideProps(overrides, "familyName")}
      ></TextField>
      <TextField
        label="Given name"
        isRequired={false}
        isReadOnly={false}
        value={givenName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName: value,
              mailAddress,
              role,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.givenName ?? value;
          }
          if (errors.givenName?.hasError) {
            runValidationTasks("givenName", value);
          }
          setGivenName(value);
        }}
        onBlur={() => runValidationTasks("givenName", givenName)}
        errorMessage={errors.givenName?.errorMessage}
        hasError={errors.givenName?.hasError}
        {...getOverrideProps(overrides, "givenName")}
      ></TextField>
      <TextField
        label="Mail address"
        isRequired={true}
        isReadOnly={false}
        value={mailAddress}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress: value,
              role,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.mailAddress ?? value;
          }
          if (errors.mailAddress?.hasError) {
            runValidationTasks("mailAddress", value);
          }
          setMailAddress(value);
        }}
        onBlur={() => runValidationTasks("mailAddress", mailAddress)}
        errorMessage={errors.mailAddress?.errorMessage}
        hasError={errors.mailAddress?.hasError}
        {...getOverrideProps(overrides, "mailAddress")}
      ></TextField>
      <TextField
        label="Role"
        isRequired={true}
        isReadOnly={false}
        value={role}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role: value,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.role ?? value;
          }
          if (errors.role?.hasError) {
            runValidationTasks("role", value);
          }
          setRole(value);
        }}
        onBlur={() => runValidationTasks("role", role)}
        errorMessage={errors.role?.errorMessage}
        hasError={errors.role?.hasError}
        {...getOverrideProps(overrides, "role")}
      ></TextField>
      <SwitchField
        label="Enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={enabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled: value,
              status,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.enabled ?? value;
          }
          if (errors.enabled?.hasError) {
            runValidationTasks("enabled", value);
          }
          setEnabled(value);
        }}
        onBlur={() => runValidationTasks("enabled", enabled)}
        errorMessage={errors.enabled?.errorMessage}
        hasError={errors.enabled?.hasError}
        {...getOverrideProps(overrides, "enabled")}
      ></SwitchField>
      <TextField
        label="Status"
        isRequired={true}
        isReadOnly={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled,
              status: value,
              owner,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      ></TextField>
      <SwitchField
        label="Owner"
        defaultChecked={false}
        isDisabled={false}
        isChecked={owner}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled,
              status,
              owner: value,
              usageStartDate,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.owner ?? value;
          }
          if (errors.owner?.hasError) {
            runValidationTasks("owner", value);
          }
          setOwner(value);
        }}
        onBlur={() => runValidationTasks("owner", owner)}
        errorMessage={errors.owner?.errorMessage}
        hasError={errors.owner?.hasError}
        {...getOverrideProps(overrides, "owner")}
      ></SwitchField>
      <TextField
        label="Usage start date"
        isRequired={false}
        isReadOnly={false}
        value={usageStartDate}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled,
              status,
              owner,
              usageStartDate: value,
              sortKey,
            };
            const result = onChange(modelFields);
            value = result?.usageStartDate ?? value;
          }
          if (errors.usageStartDate?.hasError) {
            runValidationTasks("usageStartDate", value);
          }
          setUsageStartDate(value);
        }}
        onBlur={() => runValidationTasks("usageStartDate", usageStartDate)}
        errorMessage={errors.usageStartDate?.errorMessage}
        hasError={errors.usageStartDate?.hasError}
        {...getOverrideProps(overrides, "usageStartDate")}
      ></TextField>
      <TextField
        label="Sort key"
        isRequired={false}
        isReadOnly={false}
        value={sortKey}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoUserId,
              familyName,
              givenName,
              mailAddress,
              role,
              enabled,
              status,
              owner,
              usageStartDate,
              sortKey: value,
            };
            const result = onChange(modelFields);
            value = result?.sortKey ?? value;
          }
          if (errors.sortKey?.hasError) {
            runValidationTasks("sortKey", value);
          }
          setSortKey(value);
        }}
        onBlur={() => runValidationTasks("sortKey", sortKey)}
        errorMessage={errors.sortKey?.errorMessage}
        hasError={errors.sortKey?.hasError}
        {...getOverrideProps(overrides, "sortKey")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
