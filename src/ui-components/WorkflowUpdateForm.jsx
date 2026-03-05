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
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { getWorkflow } from "../shared/api/graphql/documents/queries";
import { updateWorkflow } from "../shared/api/graphql/documents/mutations";
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
export default function WorkflowUpdateForm(props) {
  const {
    id: idProp,
    workflow: workflowModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    approvedStaffIds: [],
    rejectedStaffIds: [],
    finalDecisionTimestamp: "",
    category: "",
    customWorkflowTitle: "",
    customWorkflowContent: "",
    staffId: "",
    status: "",
    assignedApproverStaffIds: [],
    nextApprovalStepIndex: "",
    submitterApproverSetting: "",
    submitterApproverId: "",
    submitterApproverIds: [],
    submitterApproverMultipleMode: "",
  };
  const [approvedStaffIds, setApprovedStaffIds] = React.useState(
    initialValues.approvedStaffIds
  );
  const [rejectedStaffIds, setRejectedStaffIds] = React.useState(
    initialValues.rejectedStaffIds
  );
  const [finalDecisionTimestamp, setFinalDecisionTimestamp] = React.useState(
    initialValues.finalDecisionTimestamp
  );
  const [category, setCategory] = React.useState(initialValues.category);
  const [customWorkflowTitle, setCustomWorkflowTitle] = React.useState(
    initialValues.customWorkflowTitle
  );
  const [customWorkflowContent, setCustomWorkflowContent] = React.useState(
    initialValues.customWorkflowContent
  );
  const [staffId, setStaffId] = React.useState(initialValues.staffId);
  const [status, setStatus] = React.useState(initialValues.status);
  const [assignedApproverStaffIds, setAssignedApproverStaffIds] =
    React.useState(initialValues.assignedApproverStaffIds);
  const [nextApprovalStepIndex, setNextApprovalStepIndex] = React.useState(
    initialValues.nextApprovalStepIndex
  );
  const [submitterApproverSetting, setSubmitterApproverSetting] =
    React.useState(initialValues.submitterApproverSetting);
  const [submitterApproverId, setSubmitterApproverId] = React.useState(
    initialValues.submitterApproverId
  );
  const [submitterApproverIds, setSubmitterApproverIds] = React.useState(
    initialValues.submitterApproverIds
  );
  const [submitterApproverMultipleMode, setSubmitterApproverMultipleMode] =
    React.useState(initialValues.submitterApproverMultipleMode);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = workflowRecord
      ? { ...initialValues, ...workflowRecord }
      : initialValues;
    setApprovedStaffIds(cleanValues.approvedStaffIds ?? []);
    setCurrentApprovedStaffIdsValue("");
    setRejectedStaffIds(cleanValues.rejectedStaffIds ?? []);
    setCurrentRejectedStaffIdsValue("");
    setFinalDecisionTimestamp(cleanValues.finalDecisionTimestamp);
    setCategory(cleanValues.category);
    setCustomWorkflowTitle(cleanValues.customWorkflowTitle);
    setCustomWorkflowContent(cleanValues.customWorkflowContent);
    setStaffId(cleanValues.staffId);
    setStatus(cleanValues.status);
    setAssignedApproverStaffIds(cleanValues.assignedApproverStaffIds ?? []);
    setCurrentAssignedApproverStaffIdsValue("");
    setNextApprovalStepIndex(cleanValues.nextApprovalStepIndex);
    setSubmitterApproverSetting(cleanValues.submitterApproverSetting);
    setSubmitterApproverId(cleanValues.submitterApproverId);
    setSubmitterApproverIds(cleanValues.submitterApproverIds ?? []);
    setCurrentSubmitterApproverIdsValue("");
    setSubmitterApproverMultipleMode(cleanValues.submitterApproverMultipleMode);
    setErrors({});
  };
  const [workflowRecord, setWorkflowRecord] = React.useState(workflowModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getWorkflow.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getWorkflow
        : workflowModelProp;
      setWorkflowRecord(record);
    };
    queryData();
  }, [idProp, workflowModelProp]);
  React.useEffect(resetStateValues, [workflowRecord]);
  const [currentApprovedStaffIdsValue, setCurrentApprovedStaffIdsValue] =
    React.useState("");
  const approvedStaffIdsRef = React.createRef();
  const [currentRejectedStaffIdsValue, setCurrentRejectedStaffIdsValue] =
    React.useState("");
  const rejectedStaffIdsRef = React.createRef();
  const [
    currentAssignedApproverStaffIdsValue,
    setCurrentAssignedApproverStaffIdsValue,
  ] = React.useState("");
  const assignedApproverStaffIdsRef = React.createRef();
  const [
    currentSubmitterApproverIdsValue,
    setCurrentSubmitterApproverIdsValue,
  ] = React.useState("");
  const submitterApproverIdsRef = React.createRef();
  const validations = {
    approvedStaffIds: [],
    rejectedStaffIds: [],
    finalDecisionTimestamp: [],
    category: [],
    customWorkflowTitle: [],
    customWorkflowContent: [],
    staffId: [{ type: "Required" }],
    status: [{ type: "Required" }],
    assignedApproverStaffIds: [],
    nextApprovalStepIndex: [],
    submitterApproverSetting: [],
    submitterApproverId: [],
    submitterApproverIds: [],
    submitterApproverMultipleMode: [],
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
          approvedStaffIds: approvedStaffIds ?? null,
          rejectedStaffIds: rejectedStaffIds ?? null,
          finalDecisionTimestamp: finalDecisionTimestamp ?? null,
          category: category ?? null,
          customWorkflowTitle: customWorkflowTitle ?? null,
          customWorkflowContent: customWorkflowContent ?? null,
          staffId,
          status,
          assignedApproverStaffIds: assignedApproverStaffIds ?? null,
          nextApprovalStepIndex: nextApprovalStepIndex ?? null,
          submitterApproverSetting: submitterApproverSetting ?? null,
          submitterApproverId: submitterApproverId ?? null,
          submitterApproverIds: submitterApproverIds ?? null,
          submitterApproverMultipleMode: submitterApproverMultipleMode ?? null,
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
            query: updateWorkflow.replaceAll("__typename", ""),
            variables: {
              input: {
                id: workflowRecord.id,
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
      {...getOverrideProps(overrides, "WorkflowUpdateForm")}
      {...rest}
    >
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              approvedStaffIds: values,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            values = result?.approvedStaffIds ?? values;
          }
          setApprovedStaffIds(values);
          setCurrentApprovedStaffIdsValue("");
        }}
        currentFieldValue={currentApprovedStaffIdsValue}
        label={"Approved staff ids"}
        items={approvedStaffIds}
        hasError={errors?.approvedStaffIds?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "approvedStaffIds",
            currentApprovedStaffIdsValue
          )
        }
        errorMessage={errors?.approvedStaffIds?.errorMessage}
        setFieldValue={setCurrentApprovedStaffIdsValue}
        inputFieldRef={approvedStaffIdsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Approved staff ids"
          isRequired={false}
          isReadOnly={false}
          value={currentApprovedStaffIdsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.approvedStaffIds?.hasError) {
              runValidationTasks("approvedStaffIds", value);
            }
            setCurrentApprovedStaffIdsValue(value);
          }}
          onBlur={() =>
            runValidationTasks("approvedStaffIds", currentApprovedStaffIdsValue)
          }
          errorMessage={errors.approvedStaffIds?.errorMessage}
          hasError={errors.approvedStaffIds?.hasError}
          ref={approvedStaffIdsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "approvedStaffIds")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds: values,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            values = result?.rejectedStaffIds ?? values;
          }
          setRejectedStaffIds(values);
          setCurrentRejectedStaffIdsValue("");
        }}
        currentFieldValue={currentRejectedStaffIdsValue}
        label={"Rejected staff ids"}
        items={rejectedStaffIds}
        hasError={errors?.rejectedStaffIds?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "rejectedStaffIds",
            currentRejectedStaffIdsValue
          )
        }
        errorMessage={errors?.rejectedStaffIds?.errorMessage}
        setFieldValue={setCurrentRejectedStaffIdsValue}
        inputFieldRef={rejectedStaffIdsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Rejected staff ids"
          isRequired={false}
          isReadOnly={false}
          value={currentRejectedStaffIdsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.rejectedStaffIds?.hasError) {
              runValidationTasks("rejectedStaffIds", value);
            }
            setCurrentRejectedStaffIdsValue(value);
          }}
          onBlur={() =>
            runValidationTasks("rejectedStaffIds", currentRejectedStaffIdsValue)
          }
          errorMessage={errors.rejectedStaffIds?.errorMessage}
          hasError={errors.rejectedStaffIds?.hasError}
          ref={rejectedStaffIdsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "rejectedStaffIds")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Final decision timestamp"
        isRequired={false}
        isReadOnly={false}
        value={finalDecisionTimestamp}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp: value,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.finalDecisionTimestamp ?? value;
          }
          if (errors.finalDecisionTimestamp?.hasError) {
            runValidationTasks("finalDecisionTimestamp", value);
          }
          setFinalDecisionTimestamp(value);
        }}
        onBlur={() =>
          runValidationTasks("finalDecisionTimestamp", finalDecisionTimestamp)
        }
        errorMessage={errors.finalDecisionTimestamp?.errorMessage}
        hasError={errors.finalDecisionTimestamp?.hasError}
        {...getOverrideProps(overrides, "finalDecisionTimestamp")}
      ></TextField>
      <SelectField
        label="Category"
        placeholder="Please select an option"
        isDisabled={false}
        value={category}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category: value,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.category ?? value;
          }
          if (errors.category?.hasError) {
            runValidationTasks("category", value);
          }
          setCategory(value);
        }}
        onBlur={() => runValidationTasks("category", category)}
        errorMessage={errors.category?.errorMessage}
        hasError={errors.category?.hasError}
        {...getOverrideProps(overrides, "category")}
      >
        <option
          children="Paid leave"
          value="PAID_LEAVE"
          {...getOverrideProps(overrides, "categoryoption0")}
        ></option>
        <option
          children="Absence"
          value="ABSENCE"
          {...getOverrideProps(overrides, "categoryoption1")}
        ></option>
        <option
          children="Overtime"
          value="OVERTIME"
          {...getOverrideProps(overrides, "categoryoption2")}
        ></option>
        <option
          children="Clock correction"
          value="CLOCK_CORRECTION"
          {...getOverrideProps(overrides, "categoryoption3")}
        ></option>
        <option
          children="Custom"
          value="CUSTOM"
          {...getOverrideProps(overrides, "categoryoption4")}
        ></option>
      </SelectField>
      <TextField
        label="Custom workflow title"
        isRequired={false}
        isReadOnly={false}
        value={customWorkflowTitle}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle: value,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.customWorkflowTitle ?? value;
          }
          if (errors.customWorkflowTitle?.hasError) {
            runValidationTasks("customWorkflowTitle", value);
          }
          setCustomWorkflowTitle(value);
        }}
        onBlur={() =>
          runValidationTasks("customWorkflowTitle", customWorkflowTitle)
        }
        errorMessage={errors.customWorkflowTitle?.errorMessage}
        hasError={errors.customWorkflowTitle?.hasError}
        {...getOverrideProps(overrides, "customWorkflowTitle")}
      ></TextField>
      <TextField
        label="Custom workflow content"
        isRequired={false}
        isReadOnly={false}
        value={customWorkflowContent}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent: value,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.customWorkflowContent ?? value;
          }
          if (errors.customWorkflowContent?.hasError) {
            runValidationTasks("customWorkflowContent", value);
          }
          setCustomWorkflowContent(value);
        }}
        onBlur={() =>
          runValidationTasks("customWorkflowContent", customWorkflowContent)
        }
        errorMessage={errors.customWorkflowContent?.errorMessage}
        hasError={errors.customWorkflowContent?.hasError}
        {...getOverrideProps(overrides, "customWorkflowContent")}
      ></TextField>
      <TextField
        label="Staff id"
        isRequired={true}
        isReadOnly={false}
        value={staffId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId: value,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.staffId ?? value;
          }
          if (errors.staffId?.hasError) {
            runValidationTasks("staffId", value);
          }
          setStaffId(value);
        }}
        onBlur={() => runValidationTasks("staffId", staffId)}
        errorMessage={errors.staffId?.errorMessage}
        hasError={errors.staffId?.hasError}
        {...getOverrideProps(overrides, "staffId")}
      ></TextField>
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status: value,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
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
      >
        <option
          children="Draft"
          value="DRAFT"
          {...getOverrideProps(overrides, "statusoption0")}
        ></option>
        <option
          children="Submitted"
          value="SUBMITTED"
          {...getOverrideProps(overrides, "statusoption1")}
        ></option>
        <option
          children="Pending"
          value="PENDING"
          {...getOverrideProps(overrides, "statusoption2")}
        ></option>
        <option
          children="Approved"
          value="APPROVED"
          {...getOverrideProps(overrides, "statusoption3")}
        ></option>
        <option
          children="Rejected"
          value="REJECTED"
          {...getOverrideProps(overrides, "statusoption4")}
        ></option>
        <option
          children="Cancelled"
          value="CANCELLED"
          {...getOverrideProps(overrides, "statusoption5")}
        ></option>
      </SelectField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds: values,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            values = result?.assignedApproverStaffIds ?? values;
          }
          setAssignedApproverStaffIds(values);
          setCurrentAssignedApproverStaffIdsValue("");
        }}
        currentFieldValue={currentAssignedApproverStaffIdsValue}
        label={"Assigned approver staff ids"}
        items={assignedApproverStaffIds}
        hasError={errors?.assignedApproverStaffIds?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "assignedApproverStaffIds",
            currentAssignedApproverStaffIdsValue
          )
        }
        errorMessage={errors?.assignedApproverStaffIds?.errorMessage}
        setFieldValue={setCurrentAssignedApproverStaffIdsValue}
        inputFieldRef={assignedApproverStaffIdsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Assigned approver staff ids"
          isRequired={false}
          isReadOnly={false}
          value={currentAssignedApproverStaffIdsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.assignedApproverStaffIds?.hasError) {
              runValidationTasks("assignedApproverStaffIds", value);
            }
            setCurrentAssignedApproverStaffIdsValue(value);
          }}
          onBlur={() =>
            runValidationTasks(
              "assignedApproverStaffIds",
              currentAssignedApproverStaffIdsValue
            )
          }
          errorMessage={errors.assignedApproverStaffIds?.errorMessage}
          hasError={errors.assignedApproverStaffIds?.hasError}
          ref={assignedApproverStaffIdsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "assignedApproverStaffIds")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Next approval step index"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={nextApprovalStepIndex}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex: value,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.nextApprovalStepIndex ?? value;
          }
          if (errors.nextApprovalStepIndex?.hasError) {
            runValidationTasks("nextApprovalStepIndex", value);
          }
          setNextApprovalStepIndex(value);
        }}
        onBlur={() =>
          runValidationTasks("nextApprovalStepIndex", nextApprovalStepIndex)
        }
        errorMessage={errors.nextApprovalStepIndex?.errorMessage}
        hasError={errors.nextApprovalStepIndex?.hasError}
        {...getOverrideProps(overrides, "nextApprovalStepIndex")}
      ></TextField>
      <SelectField
        label="Submitter approver setting"
        placeholder="Please select an option"
        isDisabled={false}
        value={submitterApproverSetting}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting: value,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.submitterApproverSetting ?? value;
          }
          if (errors.submitterApproverSetting?.hasError) {
            runValidationTasks("submitterApproverSetting", value);
          }
          setSubmitterApproverSetting(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "submitterApproverSetting",
            submitterApproverSetting
          )
        }
        errorMessage={errors.submitterApproverSetting?.errorMessage}
        hasError={errors.submitterApproverSetting?.hasError}
        {...getOverrideProps(overrides, "submitterApproverSetting")}
      >
        <option
          children="Admins"
          value="ADMINS"
          {...getOverrideProps(overrides, "submitterApproverSettingoption0")}
        ></option>
        <option
          children="Single"
          value="SINGLE"
          {...getOverrideProps(overrides, "submitterApproverSettingoption1")}
        ></option>
        <option
          children="Multiple"
          value="MULTIPLE"
          {...getOverrideProps(overrides, "submitterApproverSettingoption2")}
        ></option>
      </SelectField>
      <TextField
        label="Submitter approver id"
        isRequired={false}
        isReadOnly={false}
        value={submitterApproverId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId: value,
              submitterApproverIds,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            value = result?.submitterApproverId ?? value;
          }
          if (errors.submitterApproverId?.hasError) {
            runValidationTasks("submitterApproverId", value);
          }
          setSubmitterApproverId(value);
        }}
        onBlur={() =>
          runValidationTasks("submitterApproverId", submitterApproverId)
        }
        errorMessage={errors.submitterApproverId?.errorMessage}
        hasError={errors.submitterApproverId?.hasError}
        {...getOverrideProps(overrides, "submitterApproverId")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds: values,
              submitterApproverMultipleMode,
            };
            const result = onChange(modelFields);
            values = result?.submitterApproverIds ?? values;
          }
          setSubmitterApproverIds(values);
          setCurrentSubmitterApproverIdsValue("");
        }}
        currentFieldValue={currentSubmitterApproverIdsValue}
        label={"Submitter approver ids"}
        items={submitterApproverIds}
        hasError={errors?.submitterApproverIds?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "submitterApproverIds",
            currentSubmitterApproverIdsValue
          )
        }
        errorMessage={errors?.submitterApproverIds?.errorMessage}
        setFieldValue={setCurrentSubmitterApproverIdsValue}
        inputFieldRef={submitterApproverIdsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Submitter approver ids"
          isRequired={false}
          isReadOnly={false}
          value={currentSubmitterApproverIdsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.submitterApproverIds?.hasError) {
              runValidationTasks("submitterApproverIds", value);
            }
            setCurrentSubmitterApproverIdsValue(value);
          }}
          onBlur={() =>
            runValidationTasks(
              "submitterApproverIds",
              currentSubmitterApproverIdsValue
            )
          }
          errorMessage={errors.submitterApproverIds?.errorMessage}
          hasError={errors.submitterApproverIds?.hasError}
          ref={submitterApproverIdsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "submitterApproverIds")}
        ></TextField>
      </ArrayField>
      <SelectField
        label="Submitter approver multiple mode"
        placeholder="Please select an option"
        isDisabled={false}
        value={submitterApproverMultipleMode}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              approvedStaffIds,
              rejectedStaffIds,
              finalDecisionTimestamp,
              category,
              customWorkflowTitle,
              customWorkflowContent,
              staffId,
              status,
              assignedApproverStaffIds,
              nextApprovalStepIndex,
              submitterApproverSetting,
              submitterApproverId,
              submitterApproverIds,
              submitterApproverMultipleMode: value,
            };
            const result = onChange(modelFields);
            value = result?.submitterApproverMultipleMode ?? value;
          }
          if (errors.submitterApproverMultipleMode?.hasError) {
            runValidationTasks("submitterApproverMultipleMode", value);
          }
          setSubmitterApproverMultipleMode(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "submitterApproverMultipleMode",
            submitterApproverMultipleMode
          )
        }
        errorMessage={errors.submitterApproverMultipleMode?.errorMessage}
        hasError={errors.submitterApproverMultipleMode?.hasError}
        {...getOverrideProps(overrides, "submitterApproverMultipleMode")}
      >
        <option
          children="Any"
          value="ANY"
          {...getOverrideProps(
            overrides,
            "submitterApproverMultipleModeoption0"
          )}
        ></option>
        <option
          children="Order"
          value="ORDER"
          {...getOverrideProps(
            overrides,
            "submitterApproverMultipleModeoption1"
          )}
        ></option>
      </SelectField>
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
          isDisabled={!(idProp || workflowModelProp)}
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
              !(idProp || workflowModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
