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
import { generateClient } from "aws-amplify/api";
import { createAppConfig } from "../shared/api/graphql/documents/mutations";
const client = generateClient();
export default function AppConfigCreateForm(props) {
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
    name: "",
    workStartTime: "",
    workEndTime: "",
    lunchRestStartTime: "",
    lunchRestEndTime: "",
    standardWorkHours: "",
    amHolidayStartTime: "",
    amHolidayEndTime: "",
    pmHolidayStartTime: "",
    pmHolidayEndTime: "",
    specialHolidayEnabled: false,
    amPmHolidayEnabled: false,
    officeMode: false,
    attendanceStatisticsEnabled: false,
    absentEnabled: false,
    hourlyPaidHolidayEnabled: false,
    themeColor: "",
    overTimeCheckEnabled: false,
  };
  const [name, setName] = React.useState(initialValues.name);
  const [workStartTime, setWorkStartTime] = React.useState(
    initialValues.workStartTime
  );
  const [workEndTime, setWorkEndTime] = React.useState(
    initialValues.workEndTime
  );
  const [lunchRestStartTime, setLunchRestStartTime] = React.useState(
    initialValues.lunchRestStartTime
  );
  const [lunchRestEndTime, setLunchRestEndTime] = React.useState(
    initialValues.lunchRestEndTime
  );
  const [standardWorkHours, setStandardWorkHours] = React.useState(
    initialValues.standardWorkHours
  );
  const [amHolidayStartTime, setAmHolidayStartTime] = React.useState(
    initialValues.amHolidayStartTime
  );
  const [amHolidayEndTime, setAmHolidayEndTime] = React.useState(
    initialValues.amHolidayEndTime
  );
  const [pmHolidayStartTime, setPmHolidayStartTime] = React.useState(
    initialValues.pmHolidayStartTime
  );
  const [pmHolidayEndTime, setPmHolidayEndTime] = React.useState(
    initialValues.pmHolidayEndTime
  );
  const [specialHolidayEnabled, setSpecialHolidayEnabled] = React.useState(
    initialValues.specialHolidayEnabled
  );
  const [amPmHolidayEnabled, setAmPmHolidayEnabled] = React.useState(
    initialValues.amPmHolidayEnabled
  );
  const [officeMode, setOfficeMode] = React.useState(initialValues.officeMode);
  const [attendanceStatisticsEnabled, setAttendanceStatisticsEnabled] =
    React.useState(initialValues.attendanceStatisticsEnabled);
  const [absentEnabled, setAbsentEnabled] = React.useState(
    initialValues.absentEnabled
  );
  const [hourlyPaidHolidayEnabled, setHourlyPaidHolidayEnabled] =
    React.useState(initialValues.hourlyPaidHolidayEnabled);
  const [themeColor, setThemeColor] = React.useState(initialValues.themeColor);
  const [overTimeCheckEnabled, setOverTimeCheckEnabled] = React.useState(
    initialValues.overTimeCheckEnabled
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setName(initialValues.name);
    setWorkStartTime(initialValues.workStartTime);
    setWorkEndTime(initialValues.workEndTime);
    setLunchRestStartTime(initialValues.lunchRestStartTime);
    setLunchRestEndTime(initialValues.lunchRestEndTime);
    setStandardWorkHours(initialValues.standardWorkHours);
    setAmHolidayStartTime(initialValues.amHolidayStartTime);
    setAmHolidayEndTime(initialValues.amHolidayEndTime);
    setPmHolidayStartTime(initialValues.pmHolidayStartTime);
    setPmHolidayEndTime(initialValues.pmHolidayEndTime);
    setSpecialHolidayEnabled(initialValues.specialHolidayEnabled);
    setAmPmHolidayEnabled(initialValues.amPmHolidayEnabled);
    setOfficeMode(initialValues.officeMode);
    setAttendanceStatisticsEnabled(initialValues.attendanceStatisticsEnabled);
    setAbsentEnabled(initialValues.absentEnabled);
    setHourlyPaidHolidayEnabled(initialValues.hourlyPaidHolidayEnabled);
    setThemeColor(initialValues.themeColor);
    setOverTimeCheckEnabled(initialValues.overTimeCheckEnabled);
    setErrors({});
  };
  const validations = {
    name: [{ type: "Required" }],
    workStartTime: [],
    workEndTime: [],
    lunchRestStartTime: [],
    lunchRestEndTime: [],
    standardWorkHours: [],
    amHolidayStartTime: [],
    amHolidayEndTime: [],
    pmHolidayStartTime: [],
    pmHolidayEndTime: [],
    specialHolidayEnabled: [],
    amPmHolidayEnabled: [],
    officeMode: [],
    attendanceStatisticsEnabled: [],
    absentEnabled: [],
    hourlyPaidHolidayEnabled: [],
    themeColor: [],
    overTimeCheckEnabled: [],
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
          name,
          workStartTime,
          workEndTime,
          lunchRestStartTime,
          lunchRestEndTime,
          standardWorkHours,
          amHolidayStartTime,
          amHolidayEndTime,
          pmHolidayStartTime,
          pmHolidayEndTime,
          specialHolidayEnabled,
          amPmHolidayEnabled,
          officeMode,
          attendanceStatisticsEnabled,
          absentEnabled,
          hourlyPaidHolidayEnabled,
          themeColor,
          overTimeCheckEnabled,
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
            query: createAppConfig.replaceAll("__typename", ""),
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
      {...getOverrideProps(overrides, "AppConfigCreateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={true}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
      ></TextField>
      <TextField
        label="Work start time"
        isRequired={false}
        isReadOnly={false}
        value={workStartTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime: value,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.workStartTime ?? value;
          }
          if (errors.workStartTime?.hasError) {
            runValidationTasks("workStartTime", value);
          }
          setWorkStartTime(value);
        }}
        onBlur={() => runValidationTasks("workStartTime", workStartTime)}
        errorMessage={errors.workStartTime?.errorMessage}
        hasError={errors.workStartTime?.hasError}
        {...getOverrideProps(overrides, "workStartTime")}
      ></TextField>
      <TextField
        label="Work end time"
        isRequired={false}
        isReadOnly={false}
        value={workEndTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime: value,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.workEndTime ?? value;
          }
          if (errors.workEndTime?.hasError) {
            runValidationTasks("workEndTime", value);
          }
          setWorkEndTime(value);
        }}
        onBlur={() => runValidationTasks("workEndTime", workEndTime)}
        errorMessage={errors.workEndTime?.errorMessage}
        hasError={errors.workEndTime?.hasError}
        {...getOverrideProps(overrides, "workEndTime")}
      ></TextField>
      <TextField
        label="Lunch rest start time"
        isRequired={false}
        isReadOnly={false}
        value={lunchRestStartTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime: value,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.lunchRestStartTime ?? value;
          }
          if (errors.lunchRestStartTime?.hasError) {
            runValidationTasks("lunchRestStartTime", value);
          }
          setLunchRestStartTime(value);
        }}
        onBlur={() =>
          runValidationTasks("lunchRestStartTime", lunchRestStartTime)
        }
        errorMessage={errors.lunchRestStartTime?.errorMessage}
        hasError={errors.lunchRestStartTime?.hasError}
        {...getOverrideProps(overrides, "lunchRestStartTime")}
      ></TextField>
      <TextField
        label="Lunch rest end time"
        isRequired={false}
        isReadOnly={false}
        value={lunchRestEndTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime: value,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.lunchRestEndTime ?? value;
          }
          if (errors.lunchRestEndTime?.hasError) {
            runValidationTasks("lunchRestEndTime", value);
          }
          setLunchRestEndTime(value);
        }}
        onBlur={() => runValidationTasks("lunchRestEndTime", lunchRestEndTime)}
        errorMessage={errors.lunchRestEndTime?.errorMessage}
        hasError={errors.lunchRestEndTime?.hasError}
        {...getOverrideProps(overrides, "lunchRestEndTime")}
      ></TextField>
      <TextField
        label="Standard work hours"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={standardWorkHours}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours: value,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.standardWorkHours ?? value;
          }
          if (errors.standardWorkHours?.hasError) {
            runValidationTasks("standardWorkHours", value);
          }
          setStandardWorkHours(value);
        }}
        onBlur={() =>
          runValidationTasks("standardWorkHours", standardWorkHours)
        }
        errorMessage={errors.standardWorkHours?.errorMessage}
        hasError={errors.standardWorkHours?.hasError}
        {...getOverrideProps(overrides, "standardWorkHours")}
      ></TextField>
      <TextField
        label="Am holiday start time"
        isRequired={false}
        isReadOnly={false}
        value={amHolidayStartTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime: value,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.amHolidayStartTime ?? value;
          }
          if (errors.amHolidayStartTime?.hasError) {
            runValidationTasks("amHolidayStartTime", value);
          }
          setAmHolidayStartTime(value);
        }}
        onBlur={() =>
          runValidationTasks("amHolidayStartTime", amHolidayStartTime)
        }
        errorMessage={errors.amHolidayStartTime?.errorMessage}
        hasError={errors.amHolidayStartTime?.hasError}
        {...getOverrideProps(overrides, "amHolidayStartTime")}
      ></TextField>
      <TextField
        label="Am holiday end time"
        isRequired={false}
        isReadOnly={false}
        value={amHolidayEndTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime: value,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.amHolidayEndTime ?? value;
          }
          if (errors.amHolidayEndTime?.hasError) {
            runValidationTasks("amHolidayEndTime", value);
          }
          setAmHolidayEndTime(value);
        }}
        onBlur={() => runValidationTasks("amHolidayEndTime", amHolidayEndTime)}
        errorMessage={errors.amHolidayEndTime?.errorMessage}
        hasError={errors.amHolidayEndTime?.hasError}
        {...getOverrideProps(overrides, "amHolidayEndTime")}
      ></TextField>
      <TextField
        label="Pm holiday start time"
        isRequired={false}
        isReadOnly={false}
        value={pmHolidayStartTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime: value,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.pmHolidayStartTime ?? value;
          }
          if (errors.pmHolidayStartTime?.hasError) {
            runValidationTasks("pmHolidayStartTime", value);
          }
          setPmHolidayStartTime(value);
        }}
        onBlur={() =>
          runValidationTasks("pmHolidayStartTime", pmHolidayStartTime)
        }
        errorMessage={errors.pmHolidayStartTime?.errorMessage}
        hasError={errors.pmHolidayStartTime?.hasError}
        {...getOverrideProps(overrides, "pmHolidayStartTime")}
      ></TextField>
      <TextField
        label="Pm holiday end time"
        isRequired={false}
        isReadOnly={false}
        value={pmHolidayEndTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime: value,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.pmHolidayEndTime ?? value;
          }
          if (errors.pmHolidayEndTime?.hasError) {
            runValidationTasks("pmHolidayEndTime", value);
          }
          setPmHolidayEndTime(value);
        }}
        onBlur={() => runValidationTasks("pmHolidayEndTime", pmHolidayEndTime)}
        errorMessage={errors.pmHolidayEndTime?.errorMessage}
        hasError={errors.pmHolidayEndTime?.hasError}
        {...getOverrideProps(overrides, "pmHolidayEndTime")}
      ></TextField>
      <SwitchField
        label="Special holiday enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={specialHolidayEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled: value,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.specialHolidayEnabled ?? value;
          }
          if (errors.specialHolidayEnabled?.hasError) {
            runValidationTasks("specialHolidayEnabled", value);
          }
          setSpecialHolidayEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks("specialHolidayEnabled", specialHolidayEnabled)
        }
        errorMessage={errors.specialHolidayEnabled?.errorMessage}
        hasError={errors.specialHolidayEnabled?.hasError}
        {...getOverrideProps(overrides, "specialHolidayEnabled")}
      ></SwitchField>
      <SwitchField
        label="Am pm holiday enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={amPmHolidayEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled: value,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.amPmHolidayEnabled ?? value;
          }
          if (errors.amPmHolidayEnabled?.hasError) {
            runValidationTasks("amPmHolidayEnabled", value);
          }
          setAmPmHolidayEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks("amPmHolidayEnabled", amPmHolidayEnabled)
        }
        errorMessage={errors.amPmHolidayEnabled?.errorMessage}
        hasError={errors.amPmHolidayEnabled?.hasError}
        {...getOverrideProps(overrides, "amPmHolidayEnabled")}
      ></SwitchField>
      <SwitchField
        label="Office mode"
        defaultChecked={false}
        isDisabled={false}
        isChecked={officeMode}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode: value,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.officeMode ?? value;
          }
          if (errors.officeMode?.hasError) {
            runValidationTasks("officeMode", value);
          }
          setOfficeMode(value);
        }}
        onBlur={() => runValidationTasks("officeMode", officeMode)}
        errorMessage={errors.officeMode?.errorMessage}
        hasError={errors.officeMode?.hasError}
        {...getOverrideProps(overrides, "officeMode")}
      ></SwitchField>
      <SwitchField
        label="Attendance statistics enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={attendanceStatisticsEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled: value,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.attendanceStatisticsEnabled ?? value;
          }
          if (errors.attendanceStatisticsEnabled?.hasError) {
            runValidationTasks("attendanceStatisticsEnabled", value);
          }
          setAttendanceStatisticsEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "attendanceStatisticsEnabled",
            attendanceStatisticsEnabled
          )
        }
        errorMessage={errors.attendanceStatisticsEnabled?.errorMessage}
        hasError={errors.attendanceStatisticsEnabled?.hasError}
        {...getOverrideProps(overrides, "attendanceStatisticsEnabled")}
      ></SwitchField>
      <SwitchField
        label="Absent enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={absentEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled: value,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.absentEnabled ?? value;
          }
          if (errors.absentEnabled?.hasError) {
            runValidationTasks("absentEnabled", value);
          }
          setAbsentEnabled(value);
        }}
        onBlur={() => runValidationTasks("absentEnabled", absentEnabled)}
        errorMessage={errors.absentEnabled?.errorMessage}
        hasError={errors.absentEnabled?.hasError}
        {...getOverrideProps(overrides, "absentEnabled")}
      ></SwitchField>
      <SwitchField
        label="Hourly paid holiday enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={hourlyPaidHolidayEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled: value,
              themeColor,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.hourlyPaidHolidayEnabled ?? value;
          }
          if (errors.hourlyPaidHolidayEnabled?.hasError) {
            runValidationTasks("hourlyPaidHolidayEnabled", value);
          }
          setHourlyPaidHolidayEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "hourlyPaidHolidayEnabled",
            hourlyPaidHolidayEnabled
          )
        }
        errorMessage={errors.hourlyPaidHolidayEnabled?.errorMessage}
        hasError={errors.hourlyPaidHolidayEnabled?.hasError}
        {...getOverrideProps(overrides, "hourlyPaidHolidayEnabled")}
      ></SwitchField>
      <TextField
        label="Theme color"
        isRequired={false}
        isReadOnly={false}
        value={themeColor}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor: value,
              overTimeCheckEnabled,
            };
            const result = onChange(modelFields);
            value = result?.themeColor ?? value;
          }
          if (errors.themeColor?.hasError) {
            runValidationTasks("themeColor", value);
          }
          setThemeColor(value);
        }}
        onBlur={() => runValidationTasks("themeColor", themeColor)}
        errorMessage={errors.themeColor?.errorMessage}
        hasError={errors.themeColor?.hasError}
        {...getOverrideProps(overrides, "themeColor")}
      ></TextField>
      <SwitchField
        label="Over time check enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={overTimeCheckEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              workStartTime,
              workEndTime,
              lunchRestStartTime,
              lunchRestEndTime,
              standardWorkHours,
              amHolidayStartTime,
              amHolidayEndTime,
              pmHolidayStartTime,
              pmHolidayEndTime,
              specialHolidayEnabled,
              amPmHolidayEnabled,
              officeMode,
              attendanceStatisticsEnabled,
              absentEnabled,
              hourlyPaidHolidayEnabled,
              themeColor,
              overTimeCheckEnabled: value,
            };
            const result = onChange(modelFields);
            value = result?.overTimeCheckEnabled ?? value;
          }
          if (errors.overTimeCheckEnabled?.hasError) {
            runValidationTasks("overTimeCheckEnabled", value);
          }
          setOverTimeCheckEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks("overTimeCheckEnabled", overTimeCheckEnabled)
        }
        errorMessage={errors.overTimeCheckEnabled?.errorMessage}
        hasError={errors.overTimeCheckEnabled?.hasError}
        {...getOverrideProps(overrides, "overTimeCheckEnabled")}
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
