/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { getCheckForUpdate } from "../graphql/queries";
import { updateCheckForUpdate } from "../graphql/mutations";
export default function CheckForUpdateUpdateForm(props) {
  const {
    id: idProp,
    checkForUpdate: checkForUpdateModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    deployUuid: "",
  };
  const [deployUuid, setDeployUuid] = React.useState(initialValues.deployUuid);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = checkForUpdateRecord
      ? { ...initialValues, ...checkForUpdateRecord }
      : initialValues;
    setDeployUuid(cleanValues.deployUuid);
    setErrors({});
  };
  const [checkForUpdateRecord, setCheckForUpdateRecord] = React.useState(
    checkForUpdateModelProp
  );
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getCheckForUpdate.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getCheckForUpdate
        : checkForUpdateModelProp;
      setCheckForUpdateRecord(record);
    };
    queryData();
  }, [idProp, checkForUpdateModelProp]);
  React.useEffect(resetStateValues, [checkForUpdateRecord]);
  const validations = {
    deployUuid: [{ type: "Required" }],
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
          deployUuid,
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
            query: updateCheckForUpdate.replaceAll("__typename", ""),
            variables: {
              input: {
                id: checkForUpdateRecord.id,
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "CheckForUpdateUpdateForm")}
      {...rest}
    >
      <TextField
        label="Deploy uuid"
        isRequired={true}
        isReadOnly={false}
        value={deployUuid}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              deployUuid: value,
            };
            const result = onChange(modelFields);
            value = result?.deployUuid ?? value;
          }
          if (errors.deployUuid?.hasError) {
            runValidationTasks("deployUuid", value);
          }
          setDeployUuid(value);
        }}
        onBlur={() => runValidationTasks("deployUuid", deployUuid)}
        errorMessage={errors.deployUuid?.errorMessage}
        hasError={errors.deployUuid?.hasError}
        {...getOverrideProps(overrides, "deployUuid")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || checkForUpdateModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || checkForUpdateModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
