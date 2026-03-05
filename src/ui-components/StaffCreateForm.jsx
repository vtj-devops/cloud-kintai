/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  SelectField,
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createStaff } from "../shared/api/graphql/documents/mutations";
const client = generateClient();
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
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
    workType: "",
    developer: false,
    approverSetting: "",
    approverSingle: "",
    approverMultiple: [],
    approverMultipleMode: "",
    shiftGroup: "",
    attendanceManagementEnabled: false,
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
  const [workType, setWorkType] = React.useState(initialValues.workType);
  const [developer, setDeveloper] = React.useState(initialValues.developer);
  const [approverSetting, setApproverSetting] = React.useState(
    initialValues.approverSetting
  );
  const [approverSingle, setApproverSingle] = React.useState(
    initialValues.approverSingle
  );
  const [approverMultiple, setApproverMultiple] = React.useState(
    initialValues.approverMultiple
  );
  const [approverMultipleMode, setApproverMultipleMode] = React.useState(
    initialValues.approverMultipleMode
  );
  const [shiftGroup, setShiftGroup] = React.useState(initialValues.shiftGroup);
  const [attendanceManagementEnabled, setAttendanceManagementEnabled] =
    React.useState(initialValues.attendanceManagementEnabled);
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
    setWorkType(initialValues.workType);
    setDeveloper(initialValues.developer);
    setApproverSetting(initialValues.approverSetting);
    setApproverSingle(initialValues.approverSingle);
    setApproverMultiple(initialValues.approverMultiple);
    setCurrentApproverMultipleValue("");
    setApproverMultipleMode(initialValues.approverMultipleMode);
    setShiftGroup(initialValues.shiftGroup);
    setAttendanceManagementEnabled(initialValues.attendanceManagementEnabled);
    setErrors({});
  };
  const [currentApproverMultipleValue, setCurrentApproverMultipleValue] =
    React.useState("");
  const approverMultipleRef = React.createRef();
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
    workType: [],
    developer: [],
    approverSetting: [],
    approverSingle: [],
    approverMultiple: [],
    approverMultipleMode: [],
    shiftGroup: [],
    attendanceManagementEnabled: [],
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
          workType,
          developer,
          approverSetting,
          approverSingle,
          approverMultiple,
          approverMultipleMode,
          shiftGroup,
          attendanceManagementEnabled,
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
          await client.graphql({
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
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
      <TextField
        label="Work type"
        isRequired={false}
        isReadOnly={false}
        value={workType}
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
              sortKey,
              workType: value,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.workType ?? value;
          }
          if (errors.workType?.hasError) {
            runValidationTasks("workType", value);
          }
          setWorkType(value);
        }}
        onBlur={() => runValidationTasks("workType", workType)}
        errorMessage={errors.workType?.errorMessage}
        hasError={errors.workType?.hasError}
        {...getOverrideProps(overrides, "workType")}
      ></TextField>
      <SwitchField
        label="Developer"
        defaultChecked={false}
        isDisabled={false}
        isChecked={developer}
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
              owner,
              usageStartDate,
              sortKey,
              workType,
              developer: value,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.developer ?? value;
          }
          if (errors.developer?.hasError) {
            runValidationTasks("developer", value);
          }
          setDeveloper(value);
        }}
        onBlur={() => runValidationTasks("developer", developer)}
        errorMessage={errors.developer?.errorMessage}
        hasError={errors.developer?.hasError}
        {...getOverrideProps(overrides, "developer")}
      ></SwitchField>
      <SelectField
        label="Approver setting"
        placeholder="Please select an option"
        isDisabled={false}
        value={approverSetting}
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
              sortKey,
              workType,
              developer,
              approverSetting: value,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.approverSetting ?? value;
          }
          if (errors.approverSetting?.hasError) {
            runValidationTasks("approverSetting", value);
          }
          setApproverSetting(value);
        }}
        onBlur={() => runValidationTasks("approverSetting", approverSetting)}
        errorMessage={errors.approverSetting?.errorMessage}
        hasError={errors.approverSetting?.hasError}
        {...getOverrideProps(overrides, "approverSetting")}
      >
        <option
          children="Admins"
          value="ADMINS"
          {...getOverrideProps(overrides, "approverSettingoption0")}
        ></option>
        <option
          children="Single"
          value="SINGLE"
          {...getOverrideProps(overrides, "approverSettingoption1")}
        ></option>
        <option
          children="Multiple"
          value="MULTIPLE"
          {...getOverrideProps(overrides, "approverSettingoption2")}
        ></option>
      </SelectField>
      <TextField
        label="Approver single"
        isRequired={false}
        isReadOnly={false}
        value={approverSingle}
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
              sortKey,
              workType,
              developer,
              approverSetting,
              approverSingle: value,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.approverSingle ?? value;
          }
          if (errors.approverSingle?.hasError) {
            runValidationTasks("approverSingle", value);
          }
          setApproverSingle(value);
        }}
        onBlur={() => runValidationTasks("approverSingle", approverSingle)}
        errorMessage={errors.approverSingle?.errorMessage}
        hasError={errors.approverSingle?.hasError}
        {...getOverrideProps(overrides, "approverSingle")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
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
              sortKey,
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple: values,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            values = result?.approverMultiple ?? values;
          }
          setApproverMultiple(values);
          setCurrentApproverMultipleValue("");
        }}
        currentFieldValue={currentApproverMultipleValue}
        label={"Approver multiple"}
        items={approverMultiple}
        hasError={errors?.approverMultiple?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "approverMultiple",
            currentApproverMultipleValue
          )
        }
        errorMessage={errors?.approverMultiple?.errorMessage}
        setFieldValue={setCurrentApproverMultipleValue}
        inputFieldRef={approverMultipleRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Approver multiple"
          isRequired={false}
          isReadOnly={false}
          value={currentApproverMultipleValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.approverMultiple?.hasError) {
              runValidationTasks("approverMultiple", value);
            }
            setCurrentApproverMultipleValue(value);
          }}
          onBlur={() =>
            runValidationTasks("approverMultiple", currentApproverMultipleValue)
          }
          errorMessage={errors.approverMultiple?.errorMessage}
          hasError={errors.approverMultiple?.hasError}
          ref={approverMultipleRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "approverMultiple")}
        ></TextField>
      </ArrayField>
      <SelectField
        label="Approver multiple mode"
        placeholder="Please select an option"
        isDisabled={false}
        value={approverMultipleMode}
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
              sortKey,
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode: value,
              shiftGroup,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.approverMultipleMode ?? value;
          }
          if (errors.approverMultipleMode?.hasError) {
            runValidationTasks("approverMultipleMode", value);
          }
          setApproverMultipleMode(value);
        }}
        onBlur={() =>
          runValidationTasks("approverMultipleMode", approverMultipleMode)
        }
        errorMessage={errors.approverMultipleMode?.errorMessage}
        hasError={errors.approverMultipleMode?.hasError}
        {...getOverrideProps(overrides, "approverMultipleMode")}
      >
        <option
          children="Any"
          value="ANY"
          {...getOverrideProps(overrides, "approverMultipleModeoption0")}
        ></option>
        <option
          children="Order"
          value="ORDER"
          {...getOverrideProps(overrides, "approverMultipleModeoption1")}
        ></option>
      </SelectField>
      <TextField
        label="Shift group"
        isRequired={false}
        isReadOnly={false}
        value={shiftGroup}
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
              sortKey,
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup: value,
              attendanceManagementEnabled,
            };
            const result = onChange(modelFields);
            value = result?.shiftGroup ?? value;
          }
          if (errors.shiftGroup?.hasError) {
            runValidationTasks("shiftGroup", value);
          }
          setShiftGroup(value);
        }}
        onBlur={() => runValidationTasks("shiftGroup", shiftGroup)}
        errorMessage={errors.shiftGroup?.errorMessage}
        hasError={errors.shiftGroup?.hasError}
        {...getOverrideProps(overrides, "shiftGroup")}
      ></TextField>
      <SwitchField
        label="Attendance management enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={attendanceManagementEnabled}
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
              owner,
              usageStartDate,
              sortKey,
              workType,
              developer,
              approverSetting,
              approverSingle,
              approverMultiple,
              approverMultipleMode,
              shiftGroup,
              attendanceManagementEnabled: value,
            };
            const result = onChange(modelFields);
            value = result?.attendanceManagementEnabled ?? value;
          }
          if (errors.attendanceManagementEnabled?.hasError) {
            runValidationTasks("attendanceManagementEnabled", value);
          }
          setAttendanceManagementEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "attendanceManagementEnabled",
            attendanceManagementEnabled
          )
        }
        errorMessage={errors.attendanceManagementEnabled?.errorMessage}
        hasError={errors.attendanceManagementEnabled?.hasError}
        {...getOverrideProps(overrides, "attendanceManagementEnabled")}
      ></SwitchField>
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
